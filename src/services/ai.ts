import { z } from 'zod'
import type { CloudflareEnv } from '../types/env'
import { CircuitBreaker } from '../utils/circuit-breaker'

// AI model types
type AIModel = 'llama-3.3-70b-instruct-fp8-fast' | 'bge-small-en-v1.5'

const titleResponseSchema = z.object({
  response: z.string(),
})

const embeddingResponseSchema = z.object({
  embedding: z.array(z.number()),
})

const backoff = (attempt: number) => Math.min(1000 * Math.pow(2, attempt), 10000)

// Create circuit breakers for each operation
const titleBreaker = new CircuitBreaker()
const contentBreaker = new CircuitBreaker()
const embeddingBreaker = new CircuitBreaker()

export async function generateBlogTitles(hostname: string, env: CloudflareEnv, retries = 3): Promise<string[]> {
  const prompt = `Generate 10 engaging blog post titles for the website ${hostname}.
The titles should be informative and SEO-friendly.
Format: One title per line, no numbering.
Keep titles between 40-60 characters.
Focus on evergreen topics that provide value to readers.`

  return titleBreaker.execute(async () => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await env.AI.run<{ response: string }>('llama-3.3-70b-instruct-fp8-fast', prompt)
        const parsed = titleResponseSchema.parse(result)
        return parsed.response
          .split('\n')
          .map((line: string) => line.trim())
          .filter((line: string) => line.length > 0 && line.length <= 60)
          .slice(0, 10)
      } catch (error) {
        console.error(`Error generating blog titles (attempt ${attempt + 1}/${retries}):`, error)
        if (attempt === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, backoff(attempt)))
      }
    }
    throw new Error('Failed to generate blog titles after retries')
  })
}

export async function generateBlogContent(title: string, env: CloudflareEnv, retries = 3): Promise<string> {
  const prompt = `Write a comprehensive blog post with the title: "${title}"

Guidelines:
- Write in a clear, engaging style
- Include an introduction, main points, and conclusion
- Use markdown formatting
- Keep paragraphs concise
- Include relevant examples and explanations
- Aim for around 1000 words
- Format with proper markdown headings and sections`

  return contentBreaker.execute(async () => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await env.AI.run<{ response: string }>('llama-3.3-70b-instruct-fp8-fast', prompt)
        const parsed = titleResponseSchema.parse(result)
        return parsed.response
      } catch (error) {
        console.error(`Error generating blog content (attempt ${attempt + 1}/${retries}):`, error)
        if (attempt === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, backoff(attempt)))
      }
    }
    throw new Error('Failed to generate blog content after retries')
  })
}

export async function generateEmbedding(text: string, env: CloudflareEnv, retries = 3): Promise<number[]> {
  return embeddingBreaker.execute(async () => {
    for (let attempt = 0; attempt < retries; attempt++) {
      try {
        const result = await env.AI.run<{ embedding: number[] }>('bge-small-en-v1.5', text)
        const parsed = embeddingResponseSchema.parse(result)
        return parsed.embedding
      } catch (error) {
        console.error(`Error generating embedding (attempt ${attempt + 1}/${retries}):`, error)
        if (attempt === retries - 1) throw error
        await new Promise(resolve => setTimeout(resolve, backoff(attempt)))
      }
    }
    throw new Error('Failed to generate embedding after retries')
  })
}
