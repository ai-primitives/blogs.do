interface Env {
  AI: {
    run<T>(model: string, input: unknown): Promise<T>;
  };
  BLOG_INDEX: {
    query(vector: number[], topK?: number): Promise<Array<{ id: string; score: number; metadata?: Record<string, any> }>>;
    insert(id: string, vector: number[], metadata?: Record<string, any>): Promise<void>;
    upsert(id: string, vector: number[], metadata?: Record<string, any>): Promise<void>;
    getByIds(ids: string[]): Promise<Array<{ id: string; metadata?: Record<string, any> }>>;
  };
}
