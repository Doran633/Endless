/** 用户 */
export interface User {
  id: string;
  name: string;
  avatar_url?: string;
}

/** 聊天会话 */
export interface Session {
  id: string;
  title: string;
  mode: 'general' | 'file';
  fileId?: string;
  createdAt: string;
}

/** 内联卡片（文件引用 / PPT 结果） */
export interface MessageCard {
  type: 'file_ref' | 'ppt_result';
  title: string;
  subtitle?: string;
  status?: string;
  action_label?: string;
}

/** 聊天消息 */
export interface Message {
  id: string;
  role: 'user' | 'assistant' | 'system';
  content: string;
  createdAt: string;
  metadata?: {
    chunk_ids?: string[];
    token_count?: number;
    cards?: MessageCard[];
  };
}

/** 文件 */
export interface DocumentChunk {
  chunk_id: string;
  file_id: string;
  chunk_index: number;
  content: string;
  char_count: number;
}

export interface EmbeddingPreview {
  chunk_id: string;
  chunk_index: number;
  vector_preview: number[];
}

export interface RetrievalResult {
  chunk_id: string;
  chunk_index: number;
  content: string;
  char_count: number;
  score: number;
}

export interface RetrieveFileResponse {
  file_id: string;
  query: string;
  top_k: number;
  result_count: number;
  results: RetrievalResult[];
}

export interface AskFileResponse {
  file_id: string;
  query: string;
  answer: string;
  top_k: number;
  used_chunk_count: number;
  used_chunks: RetrievalResult[];
  provider: string;
  model: string;
  usage: {
    input_tokens?: number | null;
    output_tokens?: number | null;
  };
}

export interface FileItem {
  id: string;
  original_name: string;
  status: 'uploaded' | 'processing' | 'ready' | 'chunked' | 'embedded' | 'indexed' | 'failed';
  size_bytes: number;
  created_at: string;
  extension: string;
  text_preview?: string;
  char_count?: number;
  parsed_at?: string;
  chunk_count?: number;
  chunk_preview?: DocumentChunk[];
  chunked_at?: string;
  embedding_count?: number;
  embedding_dimension?: number;
  embedding_preview?: EmbeddingPreview[];
  embedded_at?: string;
  vector_store_path?: string;
  indexed_at?: string;
  error_message?: string;
}

export type FileIngestionStatus =
  | 'idle'
  | 'uploading'
  | 'parsing'
  | 'chunking'
  | 'embedding'
  | 'indexing'
  | 'completed'
  | 'failed';

export interface FileIngestionState {
  status: FileIngestionStatus;
  fileName?: string;
  errorMessage?: string;
  chunkCount?: number;
  embeddingCount?: number;
  embeddingDimension?: number;
  vectorStorePath?: string;
}

/** PPT 任务 */
export interface PptJob {
  id: string;
  fileId: string;
  fileName: string;
  status: 'pending' | 'running' | 'succeeded' | 'failed';
  progress: number;
  title: string;
  error_message?: string;
  created_at: string;
}
