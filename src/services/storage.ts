import { generateBlogContent, generateEmbedding } from './ai'
import type { CloudflareEnv as Env } from '../types/env'

interface BlogPost {
  title: string
  content: string
  embedding: number[]
}

export async function storeBlogPost(hostname: string, title: string, env: Env): Promise<void> {
  try {
    // Generate content and embedding in parallel
    const [content, embedding] = await Promise.all([
      generateBlogContent(title, env),
      generateEmbedding(title, env),
    ])

    const id = `${hostname}:${title.replace(/ /g, '_')}`
    await env.BLOG_INDEX.upsert(id, embedding, { title, content })
  } catch (error) {
    console.error('Error storing blog post:', error)
    throw new Error('Failed to store blog post')
  }
}

export async function getBlogPost(hostname: string, title: string, env: Env): Promise<BlogPost | null> {
  try {
    const id = `${hostname}:${title.replace(/ /g, '_')}`
    const results = await env.BLOG_INDEX.getByIds([id])

    if (!results.length || !results[0].metadata) {
      return null
    }

    const post = results[0].metadata as BlogPost
    return post
  } catch (error) {
    console.error('Error fetching blog post:', error)
    throw new Error('Failed to fetch blog post')
  }
}

export async function findRelatedPosts(hostname: string, title: string, env: Env): Promise<BlogPost[]> {
  try {
    // Generate embedding for the current post title
    const embedding = await generateEmbedding(title, env)

    // Search for related posts using the embedding
    const results = await env.BLOG_INDEX.query(embedding, { topK: 6 })

    // Filter out the current post and posts from other domains
    const relatedPosts = results
      .filter((result: { id: string; metadata?: Record<string, any> }) =>
        result.id.startsWith(hostname) && result.id !== `${hostname}:${title.replace(/ /g, '_')}`)
      .map((result: { id: string; metadata?: Record<string, any> }) =>
        result.metadata as BlogPost)

    return relatedPosts
  } catch (error) {
    console.error('Error finding related posts:', error)
    throw new Error('Failed to find related posts')
  }
}
