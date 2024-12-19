import type { WorkersAI, VectorizeStorage } from './workers'

export interface CloudflareEnv {
  AI: {
    run<T>(model: string, input: unknown): Promise<T>;
  };
  BLOG_INDEX: {
    query(vector: number[], topK?: number): Promise<Array<{ id: string; score: number; metadata?: Record<string, any> }>>;
    insert(id: string, vector: number[], metadata?: Record<string, any>): Promise<void>;
    upsert(id: string, vector: number[], metadata?: Record<string, any>): Promise<void>;
    getByIds(ids: string[]): Promise<Array<{ id: string; metadata?: Record<string, any> }>>;
  };
  BLOG_CACHE: {
    put(key: string, value: string, options?: { expirationTtl?: number }): Promise<void>;
    get(key: string): Promise<string | null>;
    delete(key: string): Promise<void>;
  };
  ASSETS: { fetch: typeof fetch };
}

// Make the Env type available globally
declare global {
  type Env = CloudflareEnv
}

export type { CloudflareEnv }
