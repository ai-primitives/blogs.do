import { Suspense } from 'react'
import { notFound } from 'next/navigation'

interface Props {
  params: {
    title: string
  }
}

export default function BlogPost({ params }: Props) {
  const title = params.title.replace(/_/g, ' ')

  return (
    <article className="prose mx-auto p-6">
      <h1>{title}</h1>
      <Suspense fallback={<div className="animate-pulse space-y-4">
        <div className="h-4 bg-gray-200 rounded w-3/4"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
        <div className="h-4 bg-gray-200 rounded"></div>
      </div>}>
        {/* Content will be implemented in next PR */}
      </Suspense>

      <hr className="my-8" />

      <section>
        <h2>Related Posts</h2>
        <Suspense fallback={<div className="grid grid-cols-2 gap-4">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="animate-pulse space-y-2">
              <div className="h-4 bg-gray-200 rounded w-3/4"></div>
              <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            </div>
          ))}
        </div>}>
          {/* Related posts will be implemented in next PR */}
        </Suspense>
      </section>
    </article>
  )
}
