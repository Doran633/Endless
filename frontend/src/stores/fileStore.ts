import { create } from 'zustand';
import type { FileItem } from '../types';
import { mockFiles } from '../api/mock';
import { uploadFile as uploadFileApi } from '../api/fileApi';
import { parseFile as parseFileApi } from '../api/fileApi';

interface FileState {
  files: FileItem[];
  uploading: boolean;

  uploadFile: (file: File) => Promise<void>;
  parseFile: (id: string) => Promise<void>;
  removeFile: (id: string) => void;
  getFileById: (id: string) => FileItem | undefined;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: mockFiles,
  uploading: false,

  uploadFile: async (file: File) => {
    set({ uploading: true });
    try {
      const uploadedFile = await uploadFileApi(file);
      set((state) => ({
        files: [uploadedFile, ...state.files],
      }));
    } finally {
      set({ uploading: false });
    }
  },

  parseFile: async (id: string) => {
    const targetFile = get().files.find((file) => file.id === id);
    if (!targetFile) {
      throw new Error('文件不存在');
    }

    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, status: 'processing', error_message: undefined } : file
      ),
    }));

    try {
      const parsedFile = await parseFileApi(id, targetFile.extension);
      set((state) => ({
        files: state.files.map((file) =>
          file.id === id
            ? {
                ...file,
                status: 'ready',
                text_preview: parsedFile.text_preview,
                char_count: parsedFile.char_count,
                parsed_at: new Date().toISOString(),
              }
            : file
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文档解析失败';
      set((state) => ({
        files: state.files.map((file) =>
          file.id === id ? { ...file, status: 'failed', error_message: errorMessage } : file
        ),
      }));
      throw error;
    }
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
