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

  // Generate blog post titles if they don't exist
  try {
    const existingPosts = await env.BLOG_INDEX.getByIds([`${hostname}:titles`])
    if (!existingPosts.length || !existingPosts[0]?.metadata?.titles?.length) {
      // Titles don't exist, generate them in the background
      generateTitlesForDomain(hostname, env).catch(error => {
        console.error('Error generating titles:', error)
      })
    }
  } catch (error) {
    console.error('Error checking existing titles:', error)
  }

  // Return current sitemap with known URLs
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

  // Add any existing blog posts
  try {
    const existingPosts = await env.BLOG_INDEX.getByIds([`${hostname}:titles`]) as BlogPost[]
    const titles = existingPosts[0]?.metadata?.titles || []
    titles.forEach(title => {
      sitemap.push({
        url: `https://${hostname}/blog/${title.replace(/ /g, '_')}`,
        lastModified: new Date(),
        changeFrequency: 'weekly',
        priority: 0.6,
      })
    })
  } catch (error) {
    console.error('Error fetching existing titles:', error)
  }

  return new Response(generateSitemapXml(sitemap), {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}

async function generateTitlesForDomain(hostname: string, env: Env) {
  const prompt = `Generate 10 engaging blog post titles for the website ${hostname}. The titles should be informative and SEO-friendly.`

  try {
    const result = await env.AI.run('llama-3.3-70b-instruct-fp8-fast', prompt) as { response: string }
    if (!result?.response) {
      throw new Error('No response from AI model')
    }

    // Parse titles from AI response (assuming one per line)
    const titles = result.response
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0)
      .slice(0, 10)

    if (titles.length === 0) {
      throw new Error('No valid titles generated')
    }

    // Store titles in Vectorize
    await env.BLOG_INDEX.upsert(`${hostname}:titles`, [], { titles })
  } catch (error) {
    console.error('Error in title generation:', error)
    throw error // Re-throw to be caught by the caller
  }
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
