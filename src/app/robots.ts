import { type MetadataRoute } from 'next'
import { headers } from 'next/headers'

export default function robots(): MetadataRoute.Robots {
  const headersList = headers()
  const hostname = headersList.get('host') || 'localhost'

  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `https://${hostname}/sitemap.xml`,
  }
}
