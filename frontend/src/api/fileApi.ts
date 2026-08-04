import type {
  AskFileResponse,
  DocumentChunk,
  EmbeddingPreview,
  FileItem,
  RetrieveFileResponse,
} from '../types';
import { fetchWithAccess, parseApiResponse } from './http';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || '';

export async function listFiles(): Promise<FileItem[]> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/files`);
  const payload = await parseApiResponse<{ files: FileItem[] }>(
    response,
    '文件列表读取失败。'
  );

  return payload.files;
}

export async function uploadFile(file: File): Promise<FileItem> {
  const formData = new FormData();
  formData.append('file', file);

  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/files`, {
    method: 'POST',
    body: formData,
  });

  return parseApiResponse<FileItem>(response, '文件上传失败。');
}

export interface DeleteFileResponse {
  file_id: string;
  deleted: boolean;
  original_deleted: boolean;
  vector_index_deleted: boolean;
}

export async function deleteFile(fileId: string): Promise<DeleteFileResponse> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/files/${fileId}`, {
    method: 'DELETE',
  });

  return parseApiResponse<DeleteFileResponse>(response, '文件删除失败。');
}

export interface ParsedFileResponse {
  file_id: string;
  status: 'parsed';
  extension: string;
  text_preview: string;
  char_count: number;
}

export async function parseFile(fileId: string, extension: string): Promise<ParsedFileResponse> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/files/${fileId}/parse`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ extension }),
  });

  return parseApiResponse<ParsedFileResponse>(
    response,
    '文档解析失败。请确认文件不是扫描件、未损坏，并且格式为 TXT / DOCX / 可复制文本型 PDF。'
  );
}

export interface ChunkFileResponse {
  file_id: string;
  status: 'chunked';
  chunk_count: number;
  chunk_preview: DocumentChunk[];
}

export async function chunkFile(fileId: string, extension: string): Promise<ChunkFileResponse> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/files/${fileId}/chunks`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ extension }),
  });

  return parseApiResponse<ChunkFileResponse>(
    response,
    '文本切块失败，可能是解析出的文本为空或格式异常。'
  );
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
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/files/${fileId}/embeddings`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ extension }),
  });

  return parseApiResponse<EmbedFileResponse>(
    response,
    '向量化失败，请检查 embedding 配置或稍后重试。'
  );
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
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/files/${fileId}/vector-store`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ extension }),
  });

  return parseApiResponse<StoreVectorResponse>(
    response,
    '索引保存失败，请检查服务器存储状态或稍后重试。'
  );
}

export async function getFileVectorStore(fileId: string): Promise<StoreVectorResponse> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/files/${fileId}/vector-store`);

  return parseApiResponse<StoreVectorResponse>(response, '向量索引读取失败。');
}

export async function retrieveFileChunks(
  fileId: string,
  query: string,
  topK: number
): Promise<RetrieveFileResponse> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/files/${fileId}/retrieve`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, top_k: topK }),
  });

  return parseApiResponse<RetrieveFileResponse>(
    response,
    '文档检索失败，可能是索引不存在或文件尚未处理完成。'
  );
}

export async function askFile(
  fileId: string,
  query: string,
  topK: number,
  sessionId?: string
): Promise<AskFileResponse> {
  const response = await fetchWithAccess(`${API_BASE_URL}/api/v1/files/${fileId}/ask`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ query, top_k: topK, session_id: sessionId }),
  });

  return parseApiResponse<AskFileResponse>(
    response,
    'RAG 问答失败，请确认文件已完成索引，或稍后重试。'
  );
}
