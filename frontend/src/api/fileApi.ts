import type {
  AskFileResponse,
  DocumentChunk,
  EmbeddingPreview,
  FileItem,
  RetrieveFileResponse,
} from '../types';

interface ApiResponse<T> {
  code: number;
  message: string;
  data: T | null;
}

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function listFiles(): Promise<FileItem[]> {
  const response = await fetch(`${API_BASE_URL}/api/v1/files`);
  const payload = (await response.json()) as ApiResponse<{ files: FileItem[] }>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '文件列表读取失败');
  }

  return payload.data.files;
}

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

export interface DeleteFileResponse {
  file_id: string;
  deleted: boolean;
  original_deleted: boolean;
  vector_index_deleted: boolean;
}

export async function deleteFile(fileId: string): Promise<DeleteFileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}`, {
    method: 'DELETE',
  });
  const payload = (await response.json()) as ApiResponse<DeleteFileResponse>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '文件删除失败');
  }

  return payload.data;
}

export interface ParsedFileResponse {
  file_id: string;
  status: 'parsed';
  extension: string;
  text_preview: string;
  char_count: number;
}

export async function parseFile(fileId: string, extension: string): Promise<ParsedFileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ extension }),
  });

  const payload = (await response.json()) as ApiResponse<ParsedFileResponse>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '文档解析失败');
  }

  return payload.data;
}

export interface ChunkFileResponse {
  file_id: string;
  status: 'chunked';
  chunk_count: number;
  chunk_preview: DocumentChunk[];
}

export async function chunkFile(fileId: string, extension: string): Promise<ChunkFileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}/chunks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ extension }),
  });

  const payload = (await response.json()) as ApiResponse<ChunkFileResponse>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '文本切块失败');
  }

  return payload.data;
}

export interface EmbedFileResponse {
  file_id: string;
  status: 'embedded';
  chunk_count: number;
  embedding_count: number;
  embedding_dimension: number;
  embedding_preview: EmbeddingPreview[];
}

export async function embedFile(fileId: string, extension: string): Promise<EmbedFileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ extension }),
  });

  const payload = (await response.json()) as ApiResponse<EmbedFileResponse>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '向量化失败');
  }

  return payload.data;
}

export interface StoreVectorResponse {
  file_id: string;
  status: 'stored';
  chunk_count: number;
  embedding_count: number;
  embedding_dimension: number;
  embedding_model: string;
  storage_path: string;
  created_at: string;
}

export async function storeFileVectors(
  fileId: string,
  extension: string
): Promise<StoreVectorResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}/vector-store`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ extension }),
  });

  const payload = (await response.json()) as ApiResponse<StoreVectorResponse>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '向量索引保存失败');
  }

  return payload.data;
}

export async function getFileVectorStore(fileId: string): Promise<StoreVectorResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}/vector-store`);
  const payload = (await response.json()) as ApiResponse<StoreVectorResponse>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '向量索引读取失败');
  }

  return payload.data;
}

export async function retrieveFileChunks(
  fileId: string,
  query: string,
  topK: number
): Promise<RetrieveFileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}/retrieve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, top_k: topK }),
  });

  const payload = (await response.json()) as ApiResponse<RetrieveFileResponse>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || '检索失败');
  }

  return payload.data;
}

export async function askFile(
  fileId: string,
  query: string,
  topK: number
): Promise<AskFileResponse> {
  const response = await fetch(`${API_BASE_URL}/api/v1/files/${fileId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, top_k: topK }),
  });

  const payload = (await response.json()) as ApiResponse<AskFileResponse>;

  if (!response.ok || payload.code !== 0 || !payload.data) {
    throw new Error(payload.message || 'RAG 问答失败');
  }

  return payload.data;
}
