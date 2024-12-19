import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  // Add Cloudflare env to request.cf
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hostname', request.headers.get('host') || '')

  return NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })
}

export const config = {
  matcher: [
    '/blog/:path*',
    '/sitemap.xml',
    '/robots.txt',
  ],
}
