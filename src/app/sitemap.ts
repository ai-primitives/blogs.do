import { type MetadataRoute } from 'next'
import { headers } from 'next/headers'
import { type CloudflareEnv } from '@/types/env'

interface BlogPost {
  id: string;
  metadata?: {
    titles?: string[];
    content?: string;
  };
}

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // Get hostname from headers since we're not in a route handler
  const headersList = headers()
  const hostname = headersList.get('host') || 'localhost'
  const env: CloudflareEnv = process.env as any

  // Check for existing titles
  let titles: string[] = []
  try {
    const existingPosts = await env.BLOG_INDEX.getByIds([`${hostname}:titles`]) as BlogPost[]
    titles = existingPosts[0]?.metadata?.titles || []
  } catch (error) {
    console.error('Error checking existing titles:', error)
    // Continue with empty titles array
  }

  // Generate sitemap with known URLs
  const sitemap: MetadataRoute.Sitemap = [
    {
      url: `https://${hostname}`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 1,
    },
    {
      url: `https://${hostname}/blog`,
      lastModified: new Date(),
      changeFrequency: 'daily',
      priority: 0.8,
    },
  ]

  // Add existing blog posts to sitemap
  titles.forEach(title => {
    sitemap.push({
      url: `https://${hostname}/blog/${title.replace(/ /g, '_')}`,
      lastModified: new Date(),
      changeFrequency: 'weekly',
      priority: 0.6,
    })
  })

  return sitemap
}
