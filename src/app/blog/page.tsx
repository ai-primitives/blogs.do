import React, { Suspense } from 'react'
import { generateBlogTitles } from '@/services/ai'
import { headers } from 'next/headers'
import type { CloudflareEnv as Env } from '@/types/env'

interface BlogTitle {
  title: string
  slug: string
}

async function getBlogTitles(): Promise<BlogTitle[]> {
  const headersList = headers()
  const hostname = headersList.get('host') || 'localhost'

  try {
    const titles = await generateBlogTitles(hostname, process.env as unknown as Env)
    return titles.map(title => ({
      title,
      slug: title.replace(/ /g, '_')
    }))
  } catch (error) {
    console.error('Error generating blog titles:', error)
    return []
  }
}

function BlogTitleSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(9)].map((_, i) => (
        <div key={i} className="animate-pulse space-y-2 p-4 border rounded-lg">
          <div className="h-6 bg-gray-200 rounded w-3/4"></div>
          <div className="h-4 bg-gray-200 rounded w-1/2"></div>
        </div>
      ))}
    </div>
  )
}

async function BlogTitleList() {
  const titles = await getBlogTitles()

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {titles.map(({ title, slug }) => (
        <a
          key={slug}
          href={`/blog/${slug}`}
          className="p-4 border rounded-lg hover:shadow-lg transition-shadow"
        >
          <h2 className="text-xl font-semibold">{title}</h2>
        </a>
      ))}
    </div>
  )
}

export default function BlogPage() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>
      <Suspense fallback={<BlogTitleSkeleton />}>
        <BlogTitleList />
      </Suspense>
    </main>
  )
}
