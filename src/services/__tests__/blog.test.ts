import { describe, it, expect, vi, beforeEach, type Mock } from 'vitest'
import { getOrGenerateBlogPost, getBlogId } from '../blog'
import type { CloudflareEnv } from '../../types/env'

describe('Blog Service', () => {
  let mockEnv: CloudflareEnv

  beforeEach(() => {
    mockEnv = {
      BLOG_CACHE: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      },
      BLOG_LOCKS: {
        get: vi.fn(),
        put: vi.fn(),
        delete: vi.fn(),
      },
      AI: {
        run: vi.fn(),
      },
      BLOG_INDEX: {
        query: vi.fn(),
        upsert: vi.fn(),
      },
      RATE_LIMITER: {
        check: vi.fn(),
      },
      BLOG_QUEUE: {
        send: vi.fn(),
      },
      ASSETS: {
        fetch: vi.fn(),
      },
    } as unknown as CloudflareEnv
  })

  describe('getBlogId', () => {
    it('should generate correct blog ID from hostname and title', () => {
      const hostname = 'example.com'
      const title = 'Test Blog Post'
      const expected = 'example.com:Test_Blog_Post'
      expect(getBlogId(hostname, title)).toBe(expected)
    })
  })

  describe('Caching', () => {
    it('should return cached content when available', async () => {
      const cachedPost = { id: 'test', title: 'Test', content: 'Content' }
      const mockGet = mockEnv.BLOG_CACHE.get as Mock
      mockGet.mockResolvedValueOnce(JSON.stringify(cachedPost))

      const result = await getOrGenerateBlogPost('example.com', 'Test', mockEnv)
      expect(result).toEqual(cachedPost)
      expect(mockEnv.BLOG_LOCKS.put).not.toHaveBeenCalled()
    })

    it('should cache generated content', async () => {
      const mockGet = mockEnv.BLOG_CACHE.get as Mock
      const mockRun = mockEnv.AI.run as Mock
      const mockQuery = mockEnv.BLOG_INDEX.query as Mock

      mockGet.mockResolvedValueOnce(null)
      mockRun.mockResolvedValueOnce({ response: 'Generated content' })
      mockRun.mockResolvedValueOnce([0.1, 0.2, 0.3]) // embeddings
      mockQuery.mockResolvedValueOnce([])

      await getOrGenerateBlogPost('example.com', 'Test', mockEnv)
      expect(mockEnv.BLOG_CACHE.put).toHaveBeenCalled()
    })
  })

  describe('Concurrent Requests', () => {
    it('should handle concurrent requests properly', async () => {
      const mockGet = mockEnv.BLOG_CACHE.get as Mock
      const mockLockGet = mockEnv.BLOG_LOCKS.get as Mock
      const mockRun = mockEnv.AI.run as Mock
      const mockQuery = mockEnv.BLOG_INDEX.query as Mock

      mockGet.mockResolvedValue(null)
      mockLockGet.mockResolvedValue(null)
      mockRun.mockResolvedValueOnce({ response: 'Generated content' })
      mockRun.mockResolvedValueOnce([0.1, 0.2, 0.3]) // embeddings
      mockQuery.mockResolvedValueOnce([])

      const requests = Array(3).fill(null).map(() =>
        getOrGenerateBlogPost('example.com', 'Test', mockEnv)
      )

      await Promise.all(requests)
      expect(mockRun).toHaveBeenCalledTimes(2) // Once for content, once for embeddings
    })

    it('should respect lock timeout', async () => {
      const mockGet = mockEnv.BLOG_CACHE.get as Mock
      const mockLockGet = mockEnv.BLOG_LOCKS.get as Mock

      mockGet.mockResolvedValue(null)
      mockLockGet.mockImplementation(() => Promise.resolve(String(Date.now() + 30000)))

      await expect(
        getOrGenerateBlogPost('example.com', 'Test', mockEnv)
      ).rejects.toThrow('Failed to acquire lock')
    })
  })

  describe('Rate Limiting', () => {
    it('should respect rate limits through circuit breaker', async () => {
      const mockGet = mockEnv.BLOG_CACHE.get as Mock
      const mockLockGet = mockEnv.BLOG_LOCKS.get as Mock
      const mockRun = mockEnv.AI.run as Mock

      mockGet.mockResolvedValue(null)
      mockLockGet.mockResolvedValue(null)
      mockRun.mockRejectedValue(new Error('Rate limit exceeded'))

      await expect(
        getOrGenerateBlogPost('example.com', 'Test', mockEnv)
      ).rejects.toThrow()
    })
  })
})
