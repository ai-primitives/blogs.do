import { z } from 'zod'
import type { CloudflareEnv as Env } from '../types/env'

const titleResponseSchema = z.object({
  response: z.string(),
})

const embeddingResponseSchema = z.object({
  embedding: z.array(z.number()),
})

export async function generateBlogTitles(hostname: string, env: Env): Promise<string[]> {
  const prompt = `Generate 10 engaging blog post titles for the website ${hostname}.
The titles should be informative and SEO-friendly.
Format: One title per line, no numbering.
Keep titles between 40-60 characters.
Focus on evergreen topics that provide value to readers.`

  try {
    const result = await env.AI.run('llama-3.3-70b-instruct-fp8-fast', prompt)
    const parsed = titleResponseSchema.parse(result)

    return parsed.response
      .split('\n')
      .map((line: string) => line.trim())
      .filter((line: string) => line.length > 0 && line.length <= 60)
      .slice(0, 10)
  } catch (error) {
    console.error('Error generating blog titles:', error)
    throw new Error('Failed to generate blog titles')
  }
}

export async function generateBlogContent(title: string, env: Env): Promise<string> {
  const prompt = `Write a comprehensive blog post with the title: "${title}"

Guidelines:
- Write in a clear, engaging style
- Include an introduction, main points, and conclusion
- Use markdown formatting
- Keep paragraphs concise
- Include relevant examples and explanations
- Aim for around 1000 words
- Format with proper markdown headings and sections`

  try {
    const result = await env.AI.run('llama-3.3-70b-instruct-fp8-fast', prompt)
    const parsed = titleResponseSchema.parse(result)
    return parsed.response
  } catch (error) {
    console.error('Error generating blog content:', error)
    throw new Error('Failed to generate blog content')
  }
}

export async function generateEmbedding(text: string, env: Env): Promise<number[]> {
  try {
    const result = await env.AI.run('bge-small-en-v1.5', text)
    const parsed = embeddingResponseSchema.parse(result)
    return parsed.embedding
  } catch (error) {
    console.error('Error generating embedding:', error)
    throw new Error('Failed to generate embedding')
  }
}
