# blogs.do - AI-Powered Dynamic Blog Platform

A Next.js-based blogging platform that automatically generates and manages blog content using AI, deployed on Cloudflare Workers.

## Features

- **Dynamic Blog Generation**: Automatically generates blog posts using Cloudflare Workers AI
- **Domain-Based Content**: Creates unique content for each hostname
- **Vector Search**: Finds related articles using AI-powered vector similarity
- **SEO Optimized**: Automatic sitemap generation and crawler-friendly configuration
- **Streaming UI**: Real-time content updates with React Suspense

## Technology Stack

- **Framework**: Next.js with OpenNext for Cloudflare Workers deployment
- **AI Models**:
  - Content Generation: llama-3.3-70b-instruct-fp8-fast
  - Vector Embeddings: bge-small-en-v1.5
- **Storage**: Cloudflare Vectorize for content and embeddings
- **UI**: React Server Components with Suspense for streaming

## Getting Started

### Prerequisites

- Node.js 18+
- pnpm
- Cloudflare Workers account
- Cloudflare AI and Vectorize enabled

### Installation

```bash
# Install dependencies
pnpm install

# Configure Cloudflare bindings
# Add the following to wrangler.toml:
# [[ai]]
# binding = "AI"
#
# [[vectorize]]
# binding = "BLOG_INDEX"
# index_name = "blog-content"

# Deploy to Cloudflare Workers
pnpm run deploy
```

## Architecture

- **Content Generation**: Uses Workers AI to generate blog titles and content
- **Vector Storage**: Stores articles with host+title as ID in Vectorize
- **SEO**: Automatic sitemap.xml generation and robots.txt configuration
- **UI Components**:
  - Home page with streaming title generation
  - Blog post pages with immediate title rendering
  - Related posts using vector similarity search

## Development

See [TODO.md](TODO.md) for implementation details and progress tracking.

## License

MIT
