import type { ChatMessage, ChatSession } from '../types';
import { fetchWithAccess, parseApiResponse } from './http';

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

  const payload = await parseApiResponse<ChatResponseData>(
    response,
    'AI 回复失败，请稍后重试。'
  );
  return payload.answer;
}

export async function listChatSessions(): Promise<ChatSession[]> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/chat/sessions`);
  const payload = await parseApiResponse<{ sessions: ChatSession[] }>(
    response,
    '会话列表读取失败。'
  );
  return payload.sessions;
}

export async function createChatSession(title = '新对话', mode = 'chat'): Promise<ChatSession> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/chat/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ title, mode }),
  });
  return parseApiResponse<ChatSession>(response, '会话创建失败。');
}

export async function deleteChatSession(sessionId: string): Promise<void> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/chat/sessions/${sessionId}`, {
    method: 'DELETE',
  });
  await parseApiResponse<unknown>(response, '会话删除失败。');
}

export async function listChatMessages(sessionId: string): Promise<ChatMessage[]> {
  const response = await fetchWithAccess(
    `${API_BASE_URL}/api/v1/chat/sessions/${sessionId}/messages`
  );
  const payload = await parseApiResponse<{
    session_id: string;
    messages: ChatMessage[];
  }>(response, '会话消息读取失败。');

  return payload.messages;
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
  return parseApiResponse<ChatSession>(response, '会话文件绑定失败。');
}
