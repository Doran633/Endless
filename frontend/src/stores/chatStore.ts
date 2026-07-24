import { create } from 'zustand';
import type { Message, Session } from '../types';
import { mockMessages, mockSessions } from '../api/mock';
import { sendChatMessage } from '../api/chatApi';
import { askFile } from '../api/fileApi';
import { useFileStore } from './fileStore';

const INGESTING_STATUSES = ['uploading', 'parsing', 'chunking', 'embedding', 'indexing'];
const DEFAULT_RAG_TOP_K = 3;

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

  selectSession: (id: string) => void;
  createSession: (mode: 'general' | 'file', fileId?: string) => string;
  bindRagFileToCurrentSession: (fileId: string, fileName: string) => void;
  clearCurrentSessionRagFile: () => void;
  sendMessage: (content: string) => Promise<void>;
  deleteSession: (id: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: mockSessions,
  currentSessionId: mockSessions[0]?.id ?? null,
  messages: mockMessages,
  sessionRagFiles: {},
  isStreaming: false,

  selectSession: (id: string) => {
    set({ currentSessionId: id });
  },

  createSession: (mode: 'general' | 'file', fileId?: string) => {
    const id = `session-${Date.now()}`;
    const session: Session = {
      id,
      title: mode === 'file' ? '文件问答' : '新对话',
      mode,
      fileId,
      createdAt: new Date().toISOString(),
    };
    set((state) => ({
      sessions: [session, ...state.sessions],
      currentSessionId: id,
      messages: { ...state.messages, [id]: [] },
    }));
    return id;
  },

  bindRagFileToCurrentSession: (fileId: string, fileName: string) => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    set((state) => ({
      sessionRagFiles: {
        ...state.sessionRagFiles,
        [currentSessionId]: { fileId, fileName },
      },
      sessions: state.sessions.map((session) =>
        session.id === currentSessionId ? { ...session, mode: 'file', fileId } : session
      ),
    }));
  },

  clearCurrentSessionRagFile: () => {
    const { currentSessionId } = get();
    if (!currentSessionId) return;

    set((state) => {
      const sessionRagFiles = { ...state.sessionRagFiles };
      delete sessionRagFiles[currentSessionId];
      return {
        sessionRagFiles,
        sessions: state.sessions.map((session) =>
          session.id === currentSessionId
            ? { ...session, mode: 'general', fileId: undefined }
            : session
        ),
      };
    });
  },

  sendMessage: async (content: string) => {
    const { currentSessionId, messages } = get();
    if (!currentSessionId) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [currentSessionId]: [...(state.messages[currentSessionId] || []), userMsg],
      },
      isStreaming: true,
    }));

    const session = get().sessions.find((s) => s.id === currentSessionId);
    if (session && messages[currentSessionId]?.length === 0) {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === currentSessionId
            ? { ...s, title: content.length > 20 ? `${content.slice(0, 20)}...` : content }
            : s
        ),
      }));
    }

    let aiContent: string;
    let aiMetadata: Message['metadata'] = {};

    try {
      const fileState = useFileStore.getState();
      const isIngesting = INGESTING_STATUSES.includes(fileState.ingestion.status);
      const currentRagFile = get().sessionRagFiles[currentSessionId];

      if (isIngesting) {
        // Do not fall back to ordinary chat while a file is being indexed.
        aiContent = '文件还在处理中，请稍等完成索引后再基于该文件提问。';
      } else if (currentRagFile) {
        const ragResponse = await askFile(currentRagFile.fileId, content, DEFAULT_RAG_TOP_K);
        aiContent = ragResponse.answer;
        aiMetadata = {
          rag_file_id: ragResponse.file_id,
          rag_file_name: currentRagFile.fileName,
          chunk_ids: ragResponse.used_chunks.map((chunk) => chunk.chunk_id),
          token_count: ragResponse.usage.output_tokens ?? undefined,
          used_chunks: ragResponse.used_chunks.map((chunk) => ({
            chunk_id: chunk.chunk_id,
            chunk_index: chunk.chunk_index,
            score: chunk.score,
            content_preview:
              chunk.content.length > 180 ? `${chunk.content.slice(0, 180)}...` : chunk.content,
          })),
        };
      } else {
        aiContent = await sendChatMessage(content);
        aiMetadata = {
          token_count: Math.floor(Math.random() * 500) + 100,
        };
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'AI 回复失败，请稍后重试';
      aiContent = `AI 回复失败：${message}`;
    }

    const aiMsg: Message = {
      id: `msg-${Date.now() + 1}`,
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
  },

  deleteSession: (id: string) => {
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
  },
}));
