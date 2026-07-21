import { create } from 'zustand';
import type { Session, Message } from '../types';
import { mockSessions, mockMessages } from '../api/mock';
import { generateAIResponse } from '../api/mock';

interface ChatState {
  sessions: Session[];
  currentSessionId: string | null;
  messages: Record<string, Message[]>;
  isStreaming: boolean;

  // 操作
  selectSession: (id: string) => void;
  createSession: (mode: 'general' | 'file', fileId?: string) => string;
  sendMessage: (content: string) => Promise<void>;
  deleteSession: (id: string) => void;
}

export const useChatStore = create<ChatState>((set, get) => ({
  sessions: mockSessions,
  currentSessionId: mockSessions[0]?.id ?? null,
  messages: mockMessages,
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

  sendMessage: async (content: string) => {
    const { currentSessionId, messages } = get();
    if (!currentSessionId) return;

    const userMsg: Message = {
      id: `msg-${Date.now()}`,
      role: 'user',
      content,
      createdAt: new Date().toISOString(),
    };

    // 添加用户消息
    set((state) => ({
      messages: {
        ...state.messages,
        [currentSessionId]: [
          ...(state.messages[currentSessionId] || []),
          userMsg,
        ],
      },
      isStreaming: true,
    }));

    // 更新会话标题（如果是第一条消息）
    const session = get().sessions.find((s) => s.id === currentSessionId);
    if (session && messages[currentSessionId]?.length === 0) {
      set((state) => ({
        sessions: state.sessions.map((s) =>
          s.id === currentSessionId
            ? { ...s, title: content.length > 20 ? content.slice(0, 20) + '…' : content }
            : s
        ),
      }));
    }

    // 模拟 AI 响应
    const currentSession = get().sessions.find((s) => s.id === currentSessionId);
    const aiContent = await generateAIResponse(content, currentSession?.mode, currentSession?.fileId);

    const aiMsg: Message = {
      id: `msg-${Date.now() + 1}`,
      role: 'assistant',
      content: aiContent,
      createdAt: new Date().toISOString(),
      metadata: {
        token_count: Math.floor(Math.random() * 500) + 100,
      },
    };

    set((state) => ({
      messages: {
        ...state.messages,
        [currentSessionId]: [
          ...(state.messages[currentSessionId] || []),
          aiMsg,
        ],
      },
      isStreaming: false,
    }));
  },

  deleteSession: (id: string) => {
    set((state) => {
      const newSessions = state.sessions.filter((s) => s.id !== id);
      const newMessages = { ...state.messages };
      delete newMessages[id];
      return {
        sessions: newSessions,
        messages: newMessages,
        currentSessionId:
          state.currentSessionId === id
            ? newSessions[0]?.id ?? null
            : state.currentSessionId,
      };
    });
  },
}));
