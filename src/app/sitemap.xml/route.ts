import { type MetadataRoute } from 'next'
import '../../types/env'

interface CloudflareRequest extends Request {
  cf: { env: Env }
}

interface BlogPost {
  id: string;
  metadata?: {
    titles?: string[];
    content?: string;
  };
}

export async function GET(request: CloudflareRequest): Promise<Response> {
  const hostname = new URL(request.url).hostname
  const env = request.cf.env

  // Check for existing titles
  let titles: string[] = []
  try {
    const existingPosts = await env.BLOG_INDEX.getByIds([`${hostname}:titles`]) as BlogPost[]
    titles = existingPosts[0]?.metadata?.titles || []

    // Queue title generation if none exist
    if (!titles.length) {
      await env.BLOG_QUEUE.send({
        type: 'generate-titles',
        hostname,
      })
    }
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

  // Return sitemap XML
  return new Response(generateSitemapXml(sitemap), {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}

function generateSitemapXml(sitemap: MetadataRoute.Sitemap): string {
  return `<?xml version="1.0" encoding="UTF-8"?>
<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">
  ${sitemap.map(entry => `
    <url>
      <loc>${entry.url}</loc>
      <lastmod>${entry.lastModified ? (entry.lastModified instanceof Date ? entry.lastModified.toISOString() : entry.lastModified) : new Date().toISOString()}</lastmod>
      <changefreq>${entry.changeFrequency}</changefreq>
      <priority>${entry.priority}</priority>
    </url>
  `).join('')}
</urlset>`
}
