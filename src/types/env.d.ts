import type { WorkersAI, VectorizeStorage } from './workers'

export interface CloudflareEnv extends WorkersAI, VectorizeStorage {
  ASSETS: { fetch: typeof fetch }
}

// Make the Env type available globally
declare global {
  type Env = CloudflareEnv
}

export type { CloudflareEnv }
