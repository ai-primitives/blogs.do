import { type MetadataRoute } from 'next'

export function GET(request: Request): MetadataRoute.Robots {
  const hostname = new URL(request.url).hostname

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `https://${hostname}/sitemap.xml`,
  }
}
