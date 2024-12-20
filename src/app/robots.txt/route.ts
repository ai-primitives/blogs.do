import { type MetadataRoute } from 'next'

export async function GET(request: Request): Promise<Response> {
  const hostname = new URL(request.url).hostname

  const robotsContent = {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `https://${hostname}/sitemap.xml`,
  }

  const robotsTxt = `User-agent: *\nAllow: /\nSitemap: https://${hostname}/sitemap.xml`

  return new Response(robotsTxt, {
    headers: {
      'Content-Type': 'text/plain',
    },
  })
}
