import { create } from 'zustand';
import type { FileIngestionState, FileItem } from '../types';
import { mockFiles } from '../api/mock';
import { uploadFile as uploadFileApi } from '../api/fileApi';
import { parseFile as parseFileApi } from '../api/fileApi';
import { chunkFile as chunkFileApi } from '../api/fileApi';
import { embedFile as embedFileApi } from '../api/fileApi';
import { storeFileVectors as storeFileVectorsApi } from '../api/fileApi';

interface FileState {
  files: FileItem[];
  uploading: boolean;
  ingestion: FileIngestionState;

  uploadFile: (file: File) => Promise<void>;
  ingestFile: (file: File) => Promise<void>;
  parseFile: (id: string) => Promise<void>;
  chunkFile: (id: string) => Promise<void>;
  embedFile: (id: string) => Promise<void>;
  storeVectors: (id: string) => Promise<void>;
  removeFile: (id: string) => void;
  getFileById: (id: string) => FileItem | undefined;
}

export const useFileStore = create<FileState>((set, get) => ({
  files: mockFiles,
  uploading: false,
  ingestion: { status: 'idle' },

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

  ingestFile: async (file: File) => {
    let uploadedFile: FileItem | undefined;

    set({
      uploading: true,
      ingestion: { status: 'uploading', fileName: file.name },
    });

    try {
      uploadedFile = await uploadFileApi(file);
      set((state) => ({
        files: [uploadedFile!, ...state.files],
        ingestion: { status: 'parsing', fileName: uploadedFile!.original_name },
      }));

      const parsedFile = await parseFileApi(uploadedFile.id, uploadedFile.extension);
      set((state) => ({
        files: state.files.map((item) =>
          item.id === uploadedFile!.id
            ? {
                ...item,
                status: 'ready',
                text_preview: parsedFile.text_preview,
                char_count: parsedFile.char_count,
                parsed_at: new Date().toISOString(),
              }
            : item
        ),
        ingestion: { status: 'chunking', fileName: uploadedFile!.original_name },
      }));

      const chunkedFile = await chunkFileApi(uploadedFile.id, uploadedFile.extension);
      set((state) => ({
        files: state.files.map((item) =>
          item.id === uploadedFile!.id
            ? {
                ...item,
                status: 'chunked',
                chunk_count: chunkedFile.chunk_count,
                chunk_preview: chunkedFile.chunk_preview,
                chunked_at: new Date().toISOString(),
              }
            : item
        ),
        ingestion: {
          status: 'embedding',
          fileName: uploadedFile!.original_name,
          chunkCount: chunkedFile.chunk_count,
        },
      }));

      const embeddedFile = await embedFileApi(uploadedFile.id, uploadedFile.extension);
      set((state) => ({
        files: state.files.map((item) =>
          item.id === uploadedFile!.id
            ? {
                ...item,
                status: 'embedded',
                chunk_count: embeddedFile.chunk_count,
                embedding_count: embeddedFile.embedding_count,
                embedding_dimension: embeddedFile.embedding_dimension,
                embedding_preview: embeddedFile.embedding_preview,
                embedded_at: new Date().toISOString(),
              }
            : item
        ),
        ingestion: {
          status: 'completed',
          fileName: uploadedFile!.original_name,
          chunkCount: embeddedFile.chunk_count,
          embeddingCount: embeddedFile.embedding_count,
          embeddingDimension: embeddedFile.embedding_dimension,
        },
      }));

      set((state) => ({
        ingestion: {
          ...state.ingestion,
          status: 'indexing',
          fileName: uploadedFile!.original_name,
        },
      }));

      const storedFile = await storeFileVectorsApi(uploadedFile.id, uploadedFile.extension);
      set((state) => ({
        files: state.files.map((item) =>
          item.id === uploadedFile!.id
            ? {
                ...item,
                status: 'indexed',
                chunk_count: storedFile.chunk_count,
                embedding_count: storedFile.embedding_count,
                embedding_dimension: storedFile.embedding_dimension,
                vector_store_path: storedFile.storage_path,
                indexed_at: storedFile.created_at,
              }
            : item
        ),
        ingestion: {
          status: 'completed',
          fileName: uploadedFile!.original_name,
          chunkCount: storedFile.chunk_count,
          embeddingCount: storedFile.embedding_count,
          embeddingDimension: storedFile.embedding_dimension,
          vectorStorePath: storedFile.storage_path,
        },
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文件处理失败';
      set((state) => ({
        files: uploadedFile
          ? state.files.map((item) =>
              item.id === uploadedFile!.id
                ? { ...item, status: 'failed', error_message: errorMessage }
                : item
            )
          : state.files,
        ingestion: {
          status: 'failed',
          fileName: uploadedFile?.original_name ?? file.name,
          errorMessage,
        },
      }));
      throw error;
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

  chunkFile: async (id: string) => {
    const targetFile = get().files.find((file) => file.id === id);
    if (!targetFile) {
      throw new Error('文件不存在');
    }

    if (targetFile.status !== 'ready' && targetFile.status !== 'chunked') {
      throw new Error('请先完成文档解析');
    }

    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, status: 'processing', error_message: undefined } : file
      ),
    }));

    try {
      const chunkedFile = await chunkFileApi(id, targetFile.extension);
      set((state) => ({
        files: state.files.map((file) =>
          file.id === id
            ? {
                ...file,
                status: 'chunked',
                chunk_count: chunkedFile.chunk_count,
                chunk_preview: chunkedFile.chunk_preview,
                chunked_at: new Date().toISOString(),
              }
            : file
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '文本切块失败';
      set((state) => ({
        files: state.files.map((file) =>
          file.id === id ? { ...file, status: 'failed', error_message: errorMessage } : file
        ),
      }));
      throw error;
    }
  },

  embedFile: async (id: string) => {
    const targetFile = get().files.find((file) => file.id === id);
    if (!targetFile) {
      throw new Error('文件不存在');
    }

    if (
      targetFile.status !== 'chunked' &&
      targetFile.status !== 'embedded' &&
      targetFile.status !== 'indexed'
    ) {
      throw new Error('请先完成文本切块');
    }

    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, status: 'processing', error_message: undefined } : file
      ),
    }));

    try {
      const embeddedFile = await embedFileApi(id, targetFile.extension);
      set((state) => ({
        files: state.files.map((file) =>
          file.id === id
            ? {
                ...file,
                status: 'embedded',
                chunk_count: embeddedFile.chunk_count,
                embedding_count: embeddedFile.embedding_count,
                embedding_dimension: embeddedFile.embedding_dimension,
                embedding_preview: embeddedFile.embedding_preview,
                embedded_at: new Date().toISOString(),
              }
            : file
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '向量化失败';
      set((state) => ({
        files: state.files.map((file) =>
          file.id === id ? { ...file, status: 'failed', error_message: errorMessage } : file
        ),
      }));
      throw error;
    }
  },

  storeVectors: async (id: string) => {
    const targetFile = get().files.find((file) => file.id === id);
    if (!targetFile) {
      throw new Error('文件不存在');
    }

    if (targetFile.status !== 'embedded' && targetFile.status !== 'indexed') {
      throw new Error('请先完成向量化');
    }

    set((state) => ({
      files: state.files.map((file) =>
        file.id === id ? { ...file, status: 'processing', error_message: undefined } : file
      ),
    }));

    try {
      const storedFile = await storeFileVectorsApi(id, targetFile.extension);
      set((state) => ({
        files: state.files.map((file) =>
          file.id === id
            ? {
                ...file,
                status: 'indexed',
                chunk_count: storedFile.chunk_count,
                embedding_count: storedFile.embedding_count,
                embedding_dimension: storedFile.embedding_dimension,
                vector_store_path: storedFile.storage_path,
                indexed_at: storedFile.created_at,
              }
            : file
        ),
      }));
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : '向量索引保存失败';
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
