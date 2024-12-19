import { Suspense } from 'react'

export default function BlogIndex() {
  return (
    <main className="container mx-auto p-6">
      <h1 className="text-4xl font-bold mb-8">Blog Posts</h1>

      <Suspense fallback={<div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {[...Array(9)].map((_, i) => (
          <div key={i} className="animate-pulse space-y-2 p-4 border rounded-lg">
            <div className="h-6 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
          </div>
        ))}
      </div>}>
        {/* Blog post list will be implemented in next PR */}
      </Suspense>
    </main>
  )
}
