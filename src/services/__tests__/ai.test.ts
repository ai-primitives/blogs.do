import { describe, it, expect, vi, beforeEach } from 'vitest'
import type { CloudflareEnv } from '../../types/env'
import type { WorkersAI } from '../../types/workers'
import { generateBlogTitles, generateBlogContent, generateEmbedding } from '../ai'

describe('AI Service', () => {
  const mockEnv = {
    AI: {
      run: vi.fn().mockImplementation(async () => ({})) as unknown as ReturnType<typeof vi.fn> & WorkersAI['AI']['run'],
    },
    ASSETS: {
      fetch: vi.fn(),
    },
    BLOG_INDEX: {
      query: vi.fn(),
      upsert: vi.fn(),
      getByIds: vi.fn(),
    },
  } satisfies CloudflareEnv

  beforeEach(() => {
    vi.resetAllMocks()
  })

  describe('generateBlogTitles', () => {
    it('should generate blog titles for a given hostname', async () => {
      const mockResponse = {
        response: `How to Build Scalable Web Applications
        Understanding Cloud Computing Fundamentals
        10 Best Practices for Code Review
        A Guide to Microservices Architecture
        Securing Your Web Applications
        Introduction to Containerization
        Mastering Git Version Control
        Database Optimization Techniques
        CI/CD Pipeline Best Practices
        API Design Principles and Patterns`,
      }

      mockEnv.AI.run.mockResolvedValueOnce(mockResponse)

      const titles = await generateBlogTitles('example.com', mockEnv)

      expect(titles).toHaveLength(10)
      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        'llama-3.3-70b-instruct-fp8-fast',
        expect.stringContaining('example.com')
      )
    })

    it('should handle AI service errors', async () => {
      mockEnv.AI.run.mockRejectedValueOnce(new Error('AI service error'))

      await expect(generateBlogTitles('example.com', mockEnv)).rejects.toThrow('Failed to generate blog titles')
    })
  })

  describe('generateBlogContent', () => {
    it('should generate blog content for a given title', async () => {
      const mockResponse = {
        response: `# Understanding Cloud Computing Fundamentals

## Introduction
Cloud computing has revolutionized...

## Key Concepts
1. Infrastructure as a Service (IaaS)...

## Conclusion
Cloud computing continues to evolve...`,
      }

      mockEnv.AI.run.mockResolvedValueOnce(mockResponse)

      const content = await generateBlogContent('Understanding Cloud Computing', mockEnv)

      expect(content).toContain('# Understanding Cloud Computing Fundamentals')
      expect(mockEnv.AI.run).toHaveBeenCalledWith(
        'llama-3.3-70b-instruct-fp8-fast',
        expect.stringContaining('Understanding Cloud Computing')
      )
    })

    it('should handle AI service errors', async () => {
      mockEnv.AI.run.mockRejectedValueOnce(new Error('AI service error'))

      await expect(generateBlogContent('Test Title', mockEnv)).rejects.toThrow('Failed to generate blog content')
    })
  })

  describe('generateEmbedding', () => {
    it('should generate embeddings for given text', async () => {
      const mockEmbedding = {
        embedding: [0.1, 0.2, 0.3, 0.4, 0.5],
      }

      mockEnv.AI.run.mockResolvedValueOnce(mockEmbedding)

      const embedding = await generateEmbedding('Test text', mockEnv)

      expect(embedding).toEqual(mockEmbedding.embedding)
      expect(mockEnv.AI.run).toHaveBeenCalledWith('bge-small-en-v1.5', 'Test text')
    })

    it('should handle AI service errors', async () => {
      mockEnv.AI.run.mockRejectedValueOnce(new Error('AI service error'))

      await expect(generateEmbedding('Test text', mockEnv)).rejects.toThrow('Failed to generate embedding')
    })
  })
})
