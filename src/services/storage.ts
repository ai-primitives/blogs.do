import type { CloudflareEnv } from '../types/env'
import type { VectorizeStorage } from '../types/workers'

interface BlogPost {
  title: string
  content: string
  embedding: number[]
}

interface BlogTitles {
  titles: string[]
}

export function getBlogId(hostname: string, title: string): string {
  return `${hostname}:${title.replace(/\s+/g, '_')}`
}

export async function storeBlogTitles(hostname: string, titles: string[], env: CloudflareEnv): Promise<void> {
  try {
    const id = `${hostname}:titles`
    await env.BLOG_INDEX.upsert(id, new Array(1536).fill(0), { titles })
  } catch (error) {
    console.error('Error storing blog titles:', error)
    throw new Error('Failed to store blog titles')
  }
}

export async function getBlogTitles(hostname: string, env: CloudflareEnv): Promise<string[]> {
  try {
    const results = await env.BLOG_INDEX.getByIds([`${hostname}:titles`])
    if (results.length > 0 && results[0].metadata) {
      const metadata = results[0].metadata as BlogTitles
      return metadata.titles
    }
    return []
  } catch (error) {
    console.error('Error fetching blog titles:', error)
    throw new Error('Failed to fetch blog titles')
  }
}

export async function storeBlogPost(hostname: string, title: string, content: string, embedding: number[], env: CloudflareEnv): Promise<void> {
  try {
    const id = getBlogId(hostname, title)
    await env.BLOG_INDEX.upsert(id, embedding, { title, content })
  } catch (error) {
    console.error('Error storing blog post:', error)
    throw new Error('Failed to store blog post')
  }
}

export async function getBlogPost(hostname: string, title: string, env: CloudflareEnv): Promise<BlogPost | null> {
  try {
    const id = getBlogId(hostname, title)
    const results = await env.BLOG_INDEX.getByIds([id])

    if (!results.length || !results[0].metadata) {
      return null
    }

    return results[0].metadata as BlogPost
  } catch (error) {
    console.error('Error fetching blog post:', error)
    throw new Error('Failed to fetch blog post')
  }
}

export async function findRelatedPosts(embedding: number[], env: CloudflareEnv, limit: number = 6): Promise<Array<{ id: string; title: string; score: number }>> {
  try {
    const results = await env.BLOG_INDEX.query(embedding, { topK: limit })
    return results.map(({ id, score, metadata }) => ({
      id,
      title: metadata?.title || id.split(':')[1].replace(/_/g, ' '),
      score
    }))
  } catch (error) {
    console.error('Error finding related posts:', error)
    throw new Error('Failed to find related posts')
  }
}
