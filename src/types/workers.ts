export interface WorkersAI {
  AI: {
    run<T>(model: string, input: unknown): Promise<T>
  }
}

export interface VectorizeStorage {
  BLOG_INDEX: {
    query(vector: number[], options: { topK: number }): Promise<Array<{
      id: string
      score: number
      metadata?: Record<string, any>
    }>>
    upsert(id: string, vector: number[], metadata?: Record<string, any>): Promise<void>
    getByIds(ids: string[]): Promise<Array<{
      id: string
      metadata?: Record<string, any>
    }>>
  }
}
