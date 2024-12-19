import { CircuitBreaker } from '../utils/circuit-breaker'
import type { CloudflareEnv } from '../types/env'

interface BlogPost {
  id: string;
  title: string;
  content: string;
  relatedPosts?: Array<{ id: string; title: string }>;
}

const postBreaker = new CircuitBreaker()
const LOCK_TIMEOUT = 30 // 30 seconds
const MAX_RETRIES = 5
const RETRY_DELAY = 1000 // 1 second

export function getBlogId(hostname: string, title: string): string {
  return `${hostname}:${title.replace(/ /g, '_')}`
}

async function acquireLock(key: string, env: CloudflareEnv): Promise<boolean> {
  const lockKey = `lock:${key}`
  const now = Date.now()
  const expiry = now + (LOCK_TIMEOUT * 1000)

  for (let i = 0; i < MAX_RETRIES; i++) {
    // Check if lock exists
    const existingLock = await env.BLOG_LOCKS.get(lockKey)
    if (existingLock) {
      const lockTime = parseInt(existingLock, 10)
      // If lock is expired, we can take it
      if (lockTime < now) {
        await env.BLOG_LOCKS.delete(lockKey)
      } else {
        // Lock exists and is valid, wait and retry
        await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
        continue
      }
    }

    // Try to acquire lock
    await env.BLOG_LOCKS.put(lockKey, expiry.toString(), { expirationTtl: LOCK_TIMEOUT })
    // Verify we got the lock
    const verifyLock = await env.BLOG_LOCKS.get(lockKey)
    if (verifyLock === expiry.toString()) {
      return true
    }

    // Wait before retrying
    await new Promise(resolve => setTimeout(resolve, RETRY_DELAY))
  }

  return false
}

export async function getOrGenerateBlogPost(hostname: string, title: string, env: CloudflareEnv): Promise<BlogPost> {
  const id = getBlogId(hostname, title)

  // Check cache first
  const cached = await env.BLOG_CACHE.get(`post:${id}`)
  if (cached) return JSON.parse(cached)

  // Try to acquire lock
  const lockAcquired = await acquireLock(id, env)
  if (!lockAcquired) {
    throw new Error('Failed to acquire lock for blog post generation')
  }

  try {
    // Double-check cache after acquiring lock
    const cachedAfterLock = await env.BLOG_CACHE.get(`post:${id}`)
    if (cachedAfterLock) return JSON.parse(cachedAfterLock)

    // Generate post if not found
    return await postBreaker.execute(async () => {
      const post = await generateBlogPost(hostname, title, env)
      await env.BLOG_CACHE.put(`post:${id}`, JSON.stringify(post), { expirationTtl: 86400 }) // 24h cache
      return post
    })
  } finally {
    // Release lock
    await env.BLOG_LOCKS.delete(`lock:${id}`)
  }
}

async function generateBlogPost(hostname: string, title: string, env: CloudflareEnv): Promise<BlogPost> {
  const prompt = `Write a comprehensive blog post for the website ${hostname} with the title "${title}".
The content should be informative, engaging, and SEO-friendly.
Include relevant examples and explanations.
Keep the tone professional but conversational.
Aim for around 1000 words of high-quality content.`

  const result = await env.AI.run<{ response: string }>('llama-3.3-70b-instruct-fp8-fast', prompt)
  if (!result?.response) {
    throw new Error('No response from AI model')
  }

  const content = result.response.trim()
  const id = getBlogId(hostname, title)

  // Generate embeddings for the content
  const embeddingPrompt = `${title}\n\n${content}`
  const embedding = await env.AI.run<number[]>('bge-small-en-v1.5', embeddingPrompt)

  // Store in Vectorize with embeddings
  await env.BLOG_INDEX.upsert(id, embedding, {
    title,
    content,
    hostname,
  })

  // Find related posts
  const related = await env.BLOG_INDEX.query(embedding, 3)
  const relatedPosts = related
    .filter(post => post.id !== id)
    .map(post => ({
      id: post.id,
      title: post.metadata?.title || '',
    }))

  return {
    id,
    title,
    content,
    relatedPosts,
  }
}
