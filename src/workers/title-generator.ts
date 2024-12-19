import type { CloudflareEnv } from '../types/env'
import { CircuitBreaker } from '../utils/circuit-breaker'

interface QueueMessage {
  type: 'generate-titles';
  hostname: string;
}

interface Message<T = unknown> {
  body: T;
  id: string;
  timestamp: number;
  ack(): void;
  retry(): void;
}

interface MessageBatch<T = unknown> {
  messages: Message<T>[];
  queue: string;
}

const titleBreaker = new CircuitBreaker()

export default {
  async queue(batch: MessageBatch<QueueMessage>, env: CloudflareEnv): Promise<void> {
    for (const message of batch.messages) {
      if (message.body.type !== 'generate-titles') continue

      const { hostname } = message.body

      try {
        await generateTitlesForDomain(hostname, env)
        message.ack()
      } catch (error) {
        console.error(`Error processing title generation for ${hostname}:`, error)
        message.retry()
      }
    }
  }
}

async function generateTitlesForDomain(hostname: string, env: CloudflareEnv): Promise<void> {
  return titleBreaker.execute(async () => {
    const prompt = `Generate 10 engaging blog post titles for the website ${hostname}.
The titles should be informative and SEO-friendly.
Format: One title per line, no numbering.
Keep titles between 40-60 characters.
Focus on evergreen topics that provide value to readers.`

    const result = await env.AI.run<{ response: string }>('llama-3.3-70b-instruct-fp8-fast', prompt)
    if (!result?.response) {
      throw new Error('No response from AI model')
    }

    const titles = result.response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0 && line.length <= 60)
      .slice(0, 10)

    if (titles.length === 0) {
      throw new Error('No valid titles generated')
    }

    // Store titles in Vectorize
    await env.BLOG_INDEX.upsert(`${hostname}:titles`, [], { titles })
  })
}
