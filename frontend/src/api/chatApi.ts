import type { ChatMessage, ChatSession } from '../types';
import { fetchWithAccess } from './http';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

interface ChatResponseData {
  answer: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function sendChatMessage(message: string, sessionId?: string): Promise<string> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message, session_id: sessionId }),
  });

  const payload = (await response.json()) as ApiResponse<ChatResponseData>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || 'AI 回复失败，请稍后重试');
  }

  return payload.data.answer;
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/chat/sessions`);
  const payload = (await response.json()) as ApiResponse<{ sessions: ChatSession[] }>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '会话列表读取失败');
  }

  return payload.data.sessions;
}

export async function createChatSession(title = '新对话', mode = 'chat'): Promise<ChatSession> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/chat/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, mode }),
  });
  const payload = (await response.json()) as ApiResponse<ChatSession>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '会话创建失败');
  }

  return payload.data;
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  const payload = (await response.json()) as ApiResponse<unknown>;

  if (!response.ok || payload.code !== 0) {
    throw new Error(payload.message || '会话删除失败');
  }
}

export async function listChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/messages`);
  const payload = (await response.json()) as ApiResponse<{
    session_id: string;
    messages: ChatMessage[];
  }>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '会话消息读取失败');
  }

  return payload.data.messages;
}

export async function bindChatSessionFile(
  sessionId: string,
  fileId: string | null
): Promise<ChatSession> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/file`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ file_id: fileId }),
  });
  const payload = (await response.json()) as ApiResponse<ChatSession>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '会话文件绑定失败');
  }

  return payload.data;
}
