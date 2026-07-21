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
export interface FileItem {
  id: string;
  original_name: string;
  status: 'uploaded' | 'processing' | 'ready' | 'failed';
  size_bytes: number;
  created_at: string;
  extension: string;
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
