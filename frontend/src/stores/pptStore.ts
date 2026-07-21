import { create } from 'zustand';
import type { PptJob } from '../types';

interface PptState {
  jobs: PptJob[];

  createJob: (fileId: string, fileName: string, title: string) => Promise<void>;
  getJobByFileId: (fileId: string) => PptJob | undefined;
}

export const usePptStore = create<PptState>((set, get) => ({
  jobs: [],

  createJob: async (fileId: string, fileName: string, title: string) => {
    const job: PptJob = {
      id: `ppt-${Date.now()}`,
      fileId,
      fileName,
      status: 'pending',
      progress: 0,
      title,
      created_at: new Date().toISOString(),
    };

    set((state) => ({
      jobs: [job, ...state.jobs],
    }));

    // 模拟任务进度更新
    const simulateProgress = async () => {
      // pending → running
      await new Promise((r) => setTimeout(r, 1000));
      set((state) => ({
        jobs: state.jobs.map((j) =>
          j.id === job.id ? { ...j, status: 'running' as const, progress: 10 } : j
        ),
      }));

      // 逐步增加进度
      for (let p = 20; p <= 90; p += Math.floor(Math.random() * 15) + 5) {
        await new Promise((r) => setTimeout(r, 800 + Math.random() * 600));
        set((state) => ({
          jobs: state.jobs.map((j) =>
            j.id === job.id ? { ...j, progress: Math.min(p, 95) } : j
          ),
        }));
      }

      // 完成
      await new Promise((r) => setTimeout(r, 1200));
      set((state) => ({
        jobs: state.jobs.map((j) =>
          j.id === job.id
            ? { ...j, status: 'succeeded' as const, progress: 100 }
            : j
        ),
      }));
    };

    simulateProgress();
  },

  getJobByFileId: (fileId: string) => {
    return get().jobs.find((j) => j.fileId === fileId);
  },
}));
