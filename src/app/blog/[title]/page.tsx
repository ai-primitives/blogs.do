import React, { Suspense } from 'react'
import { headers } from 'next/headers'
import { getBlogPost, findRelatedPosts, storeBlogPost } from '@/services/storage'
import type { BlogPost } from '@/services/storage'

interface PageProps {
  params: {
    title: string
  }
}

function BlogPostSkeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-8 bg-gray-200 rounded w-3/4 mb-8"></div>
      <div className="space-y-4">
        {[...Array(6)].map((_, i) => (
          <div key={i} className="h-4 bg-gray-200 rounded w-full"></div>
        ))}
      </div>
    </div>
  )
}

function RelatedPostsSkeleton() {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {[...Array(6)].map((_, i) => (
        <div key={i} className="animate-pulse">
          <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        </div>
      ))}
    </div>
  )
}

async function BlogPostContent({ title, hostname }: { title: string; hostname: string }) {
  const formattedTitle = title.replace(/_/g, ' ')
  let post = await getBlogPost(hostname, formattedTitle, process.env as unknown as Env)

  if (!post) {
    // Generate and store the blog post if it doesn't exist
    await storeBlogPost(hostname, formattedTitle, process.env as unknown as Env)
    post = await getBlogPost(hostname, formattedTitle, process.env as unknown as Env)
  }

  if (!post) {
    throw new Error('Failed to generate blog post')
  }

  return (
    <article className="prose lg:prose-xl">
      <h1>{post.title}</h1>
      <div dangerouslySetInnerHTML={{ __html: post.content }} />
    </article>
  )
}

async function RelatedPosts({ title, hostname }: { title: string; hostname: string }) {
  const formattedTitle = title.replace(/_/g, ' ')
  const relatedPosts = await findRelatedPosts(hostname, formattedTitle, process.env as unknown as Env)

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-bold mb-4">Related Posts</h2>
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {relatedPosts.map((post) => (
          <a
            key={post.title}
            href={`/blog/${post.title.replace(/ /g, '_')}`}
            className="p-4 border rounded-lg hover:shadow-lg transition-shadow"
          >
            <h3 className="text-lg font-semibold">{post.title}</h3>
          </a>
        ))}
      </div>
    </div>
  )
}

export default function BlogPostPage({ params }: PageProps) {
  const headersList = headers()
  const hostname = headersList.get('host') || 'localhost'

  return (
    <main className="container mx-auto px-4 py-8">
      <Suspense fallback={<BlogPostSkeleton />}>
        <BlogPostContent title={params.title} hostname={hostname} />
      </Suspense>

      <Suspense fallback={<RelatedPostsSkeleton />}>
        <RelatedPosts title={params.title} hostname={hostname} />
      </Suspense>
    </main>
  )
}
