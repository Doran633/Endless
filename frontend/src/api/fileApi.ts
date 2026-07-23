import type { FileItem } from '../types';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8000';

export async function uploadFile(file: File): Promise<FileItem> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetch(`${API_BASE_URL}/api/v1/files`, {
    method: 'POST',
    body: formData,
  });

  const payload = (await response.json()) as ApiResponse<FileItem>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '文件上传失败');
  }

  return payload.data;
}
