import { create } from 'zustand';
import type { FileItem } from '../types';
import { mockFiles } from '../api/mock';

interface FileState {
  files: FileItem[];
  uploading: boolean;

  uploadFile: (file: File) => Promise<void>;
  removeFile: (id: string) => void;
  getFileById: (id: string) => FileItem | undefined;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: mockFiles,
  uploading: false,

  uploadFile: async (file: File) => {
    set({ uploading: true });

    const ext = file.name.split('.').pop() ?? 'unknown';
    const newFile: FileItem = {
      id: `file-${Date.now()}`,
      original_name: file.name,
      extension: ext,
      status: 'processing',
      size_bytes: file.size,
      created_at: new Date().toISOString(),
    };

    // 立即显示为 processing
    set((state) => ({
      files: [newFile, ...state.files],
      uploading: false,
    }));

    // 模拟解析延迟（大文件稍长）
    const delay = Math.min(2000, Math.max(800, Math.floor(file.size / 10000)));
    await new Promise((r) => setTimeout(r, delay));

    // 状态变为 ready
    set((state) => ({
      files: state.files.map((f) =>
        f.id === newFile.id ? { ...f, status: 'ready' as const } : f
      ),
    }));
  },

  removeFile: (id: string) => {
    set((state) => ({
      files: state.files.filter((f) => f.id !== id),
    }));
  },

  getFileById: (id: string) => {
    return get().files.find((f) => f.id === id);
  },
}));
