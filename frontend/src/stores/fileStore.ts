import { create } from 'zustand';
import type { FileItem } from '../types';
import { mockFiles } from '../api/mock';
import { uploadFile as uploadFileApi } from '../api/fileApi';

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
    try {
      const uploadedFile = await uploadFileApi(file);
      set((state) => ({
        files: [uploadedFile, ...state.files],
      }));
    } finally {
      set({ uploading: false });
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
