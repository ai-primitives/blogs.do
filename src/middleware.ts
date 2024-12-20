import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'
import type { CloudflareEnv } from './types/env'

export const config = {
  matcher: [
    '/blog/:path*',
    '/sitemap.xml',
  ],
}

export async function middleware(request: NextRequest) {
  const env = request.cf as unknown as CloudflareEnv
  const hostname = request.headers.get('host') || 'default'

  // Set hostname header for downstream use
  const requestHeaders = new Headers(request.headers)
  requestHeaders.set('x-hostname', hostname)

  // Rate limit based on hostname and path
  const key = `${hostname}:${request.nextUrl.pathname}`
  const limit = await env.RATE_LIMITER.check(key)

  if (!limit.success) {
    return new Response('Rate limit exceeded', {
      status: 429,
      headers: {
        'Content-Type': 'text/plain',
        'Retry-After': '60',
        'X-RateLimit-Limit': '60',
        'X-RateLimit-Remaining': String(limit.remaining),
      },
    })
  }

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  })

  Object.defineProperty(response, 'locals', {
    value: { env },
    writable: false
  })

  return response
}
