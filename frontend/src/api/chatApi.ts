interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

interface ChatResponseData {
  answer: string;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function sendChatMessage(message: string): Promise<string> {
  const response = await fetch(`${API_BASE_URL}/api/v1/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ message }),
  });

  const payload = (await response.json()) as ApiResponse<ChatResponseData>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || 'AI 回复失败，请稍后重试');
  }

  return payload.data.answer;
}
