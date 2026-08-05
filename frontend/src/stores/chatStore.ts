import { create } from 'zustand';
import type { ChatMessage, ChatMessageMetadata, ChatSession, Message, Session } from '../types';
import {
  bindChatSessionFile,
  createChatSession,
  deleteChatSession,
  listChatMessages,
  listChatSessions,
  sendChatMessage,
} from '../api/chatApi';
import { askFile } from '../api/fileApi';
import { ApiError, formatApiError } from '../api/http';
import { useFileStore } from './fileStore';

const INGESTING_STATUSES = ['uploading', 'parsing', 'chunking', 'embedding', 'indexing'];
const DEFAULT_RAG_TOP_K = Number(import.meta.env.VITE_RAG_DEFAULT_TOP_K || 3);

interface SessionRagFile {
  fileId: string;
  fileName: string;
}

interface ChatState {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Record<string, Message[]>;
  sessionRagFiles: Record<string, SessionRagFile>;
  isStreaming: boolean;
  isLoadingSessions: boolean;

  loadSessions: () => Promise<void>;
  selectSession: (id: string) => Promise<void>;
  createSession: (mode: 'general' | 'file', fileId?: string) => Promise<string>;
  bindRagFileToCurrentSession: (fileId: string, fileName: string) => Promise<void>;
  clearCurrentSessionRagFile: () => Promise<void>;
  sendMessage: (content: string) => Promise<void>;
  deleteSession: (id: string) => Promise<void>;
}

function toSession(record: ChatSession): Session {
  return {
    id: record.id,
    title: record.title,
    mode: record.bound_file_id ? 'file' : 'general',
    fileId: record.bound_file_id ?? undefined,
    createdAt: record.created_at,
    updatedAt: record.updated_at,
  };
}

function normalizeMetadata(metadata?: ChatMessageMetadata | null): Message['metadata'] {
  if (!metadata) return undefined;
  return {
    ...metadata,
    rag_file_name: metadata.rag_file_name ?? undefined,
    debug_trace: metadata.debug_trace ?? undefined,
    used_chunks: metadata.used_chunks?.map((chunk) => ({
      chunk_id: chunk.chunk_id,
      chunk_index: chunk.chunk_index,
      score: chunk.score,
      char_count: chunk.char_count,
      content_preview:
        chunk.content_preview ??
        (chunk.content && chunk.content.length > 180
          ? `${chunk.content.slice(0, 180)}...`
          : chunk.content ?? ''),
    })),
  };
}

function toMessage(record: ChatMessage): Message {
  return {
    id: record.id,
    role: record.role,
    content: record.content,
    createdAt: record.created_at,
    metadata: normalizeMetadata(record.metadata),
  };
}

function buildRagFileMap(sessions: Session[]): Record<string, SessionRagFile> {
  const files = useFileStore.getState().files;
  return sessions.reduce<Record<string, SessionRagFile>>((acc, session) => {
    if (!session.fileId) return acc;
    const file = files.find((item) => item.id === session.fileId);
    acc[session.id] = {
      fileId: session.fileId,
      fileName: file?.original_name ?? session.fileId,
    };
    return acc;
  }, {});
}

function buildAutoTitle(content: string): string {
  const normalized = content.trim().replace(/\s+/g, ' ');
  if (!normalized) return '';
  return normalized.length > 24 ? `${normalized.slice(0, 24)}...` : normalized;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: [],
  currentSessionId: null,
  messages: {},
  sessionRagFiles: {},
  isStreaming: false,
  isLoadingSessions: false,

  loadSessions: async () => {
    set({ isLoadingSessions: true });
    try {
      let sessionRecords = await listChatSessions();
      if (sessionRecords.length === 0) {
        const created = await createChatSession();
        sessionRecords = [created];
      }

      const sessions = sessionRecords.map(toSession);
      const currentSessionId = get().currentSessionId ?? sessions[0]?.id ?? null;
      set({
        sessions,
        currentSessionId,
        sessionRagFiles: buildRagFileMap(sessions),
      });

      if (currentSessionId) {
        await get().selectSession(currentSessionId);
      }
    } finally {
      set({ isLoadingSessions: false });
    }
  },

  selectSession: async (id: string) => {
    set({ currentSessionId: id });
    const records = await listChatMessages(id);
    set((state) => ({
      messages: {
        ...state.messages,
        [id]: records.map(toMessage),
      },
    }));
  },

  createSession: async (mode: 'general' | 'file', fileId?: string) => {
    const created = await createChatSession(mode === 'file' ? '文件问答' : '新对话', 'chat');
    const session = toSession({ ...created, bound_file_id: fileId ?? created.bound_file_id });

    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSessionId: session.id,
      messages: { ...state.messages, [session.id]: [] },
    }));

    if (fileId) {
      const file = useFileStore.getState().getFileById(fileId);
      await get().bindRagFileToCurrentSession(fileId, file?.original_name ?? fileId);
    }

    return session.id;
  },

  bindRagFileToCurrentSession: async (fileId: string, fileName: string) => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    await bindChatSessionFile(currentSessionId, fileId);
    set((state) => ({
      sessionRagFiles: {
        ...state.sessionRagFiles,
        [currentSessionId]: { fileId, fileName },
      },
      sessions: state.sessions.map((session) =>
        session.id === currentSessionId
          ? { ...session, mode: 'file', fileId, updatedAt: new Date().toISOString() }
          : session
      ),
    }));
  },

  clearCurrentSessionRagFile: async () => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    await bindChatSessionFile(currentSessionId, null);
    set((state) => {
      const sessionRagFiles = { ...state.sessionRagFiles };
      delete sessionRagFiles[currentSessionId];
      return {
        sessionRagFiles,
        sessions: state.sessions.map((session) =>
          session.id === currentSessionId
            ? { ...session, mode: 'general', fileId: undefined, updatedAt: new Date().toISOString() }
            : session
        ),
      };
    });
  },

  sendMessage: async (content: string) => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    const autoTitle = buildAutoTitle(content);

    const userMsg: Message = {
      id: `local-user-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [currentSessionId]: [...(state.messages[currentSessionId] || []), userMsg],
      },
      sessions: autoTitle
        ? state.sessions.map((session) =>
            session.id === currentSessionId && session.title === '新对话'
              ? { ...session, title: autoTitle }
              : session
          )
        : state.sessions,
      isStreaming: true,
    }));

    let aiContent: string;
    let aiMetadata: Message['metadata'] = {};

    try {
      const fileState = useFileStore.getState();
      const isIngesting = INGESTING_STATUSES.includes(fileState.ingestion.status);
      const currentRagFile = get().sessionRagFiles[currentSessionId];

      if (isIngesting) {
        aiContent = '文件还在处理中，请稍等索引完成后再基于该文件提问。';
      } else if (currentRagFile) {
        const ragResponse = await askFile(
          currentRagFile.fileId,
          content,
          DEFAULT_RAG_TOP_K,
          currentSessionId
        );
        aiContent = ragResponse.answer;
        aiMetadata = {
          rag_file_id: ragResponse.file_id,
          rag_file_name: currentRagFile.fileName,
          debug_trace: ragResponse.debug_trace ?? undefined,
          chunk_ids: ragResponse.used_chunks.map((chunk) => chunk.chunk_id),
          token_count: ragResponse.usage.output_tokens ?? undefined,
          used_chunks: ragResponse.used_chunks.map((chunk) => ({
            chunk_id: chunk.chunk_id,
            chunk_index: chunk.chunk_index,
            score: chunk.score,
            char_count: chunk.char_count,
            content_preview:
              chunk.content.length > 180 ? `${chunk.content.slice(0, 180)}...` : chunk.content,
          })),
        };
      } else {
        aiContent = await sendChatMessage(content, currentSessionId);
      }
    } catch (error) {
      const message = formatApiError(error, 'AI 回复失败，请稍后重试。');
      const requestId = error instanceof ApiError ? error.requestId : undefined;
      aiContent = requestId
        ? `AI 回复失败：${message}\n\n错误追踪 ID：${requestId}`
        : `AI 回复失败：${message}`;
    }

    const aiMsg: Message = {
      id: `local-assistant-${Date.now() + 1}`,
      role: 'assistant',
      content: aiContent,
      createdAt: new Date().toISOString(),
      metadata: aiMetadata,
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [currentSessionId]: [...(state.messages[currentSessionId] || []), aiMsg],
      },
      isStreaming: false,
    }));

    // Refresh from the backend so local optimistic messages are replaced by persisted records.
    await get().selectSession(currentSessionId);
    await get().loadSessions();
  },

  deleteSession: async (id: string) => {
    await deleteChatSession(id);
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id);
      const newMessages = { ...state.messages };
      const newSessionRagFiles = { ...state.sessionRagFiles };
      delete newMessages[id];
      delete newSessionRagFiles[id];
      return {
        sessions: newSessions,
        messages: newMessages,
        sessionRagFiles: newSessionRagFiles,
        currentSessionId:
          state.currentSessionId === id ? newSessions[0]?.id ?? null : state.currentSessionId,
      };
    });

    const { currentSessionId } = get();
    if (currentSessionId) {
      await get().selectSession(currentSessionId);
    } else {
      await get().loadSessions();
    }
  },
}));
