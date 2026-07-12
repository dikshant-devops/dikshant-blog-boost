# Tech With Dikshant - DevOps Blog

A modern, high-performance blog platform focused on DevOps tutorials and best practices.

**Live URL**: https://techwithdikshant.com

## 🚀 Quick Start

### Prerequisites
- Node.js 22.12+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

### Local Development

```sh
# Clone the repository
git clone <YOUR_GIT_URL>

# Navigate to project directory
cd dikshant-blog-boost

# Install dependencies
npm install

# Start development server (runs on http://localhost:8080)
npm run dev
```

## 📝 Adding Blog Posts

See [HOW_TO_ADD_BLOG_POSTS.md](./HOW_TO_ADD_BLOG_POSTS.md) for detailed instructions.

**Quick steps:**
1. Create a `.md` file in `/public/blog-posts/`
2. Add structured frontmatter for category, platform, tools, and tags
3. Write your content in Markdown
4. Run `npm run content:index` for local preview, or let `npm run build` regenerate content artifacts automatically

**Example**:
```markdown
---
title: "Production Docker Deployment with Kubernetes"
excerpt: "A tested Docker and Kubernetes deployment walkthrough with verification commands, observed output, and rollback guidance."
date: "2024-01-20"
readTime: "5 min read"
tags: ["Docker", "Kubernetes"]
category: "Containers"
platform: "Kubernetes"
tools: ["Docker", "Kubernetes"]
image: "/og-default.jpg"
---

Start the article introduction here. The frontmatter title is rendered as the page H1.

## First Tested Step
```

Tags drive public discovery. For example, `tags: ["GCP", "Security", "Cloud Armor"]` makes the same standalone article appear in each matching tag feed. Every tag feed is a normal date-ordered article list.

Playlists are separate and optional for GCP, AWS, and Kubernetes posts. Add `playlist` and `playlistOrder` only when an article is intentionally part of an ordered collection. Playlists are published at `/playlists/<playlist-slug>` and do not partition tag feeds. An explicitly marked `playlistOnly: true` lesson remains searchable and independently addressable while staying out of default feeds, homepage recommendations, and RSS.

## 🛠️ Development Commands

```sh
# Start development server
npm run dev

# Regenerate blog index, sitemap, RSS feed, and robots metadata
npm run content:index

# Build for production
npm run build

# Re-run release artifact checks without rebuilding
npm run verify:build

# Preview production build
npm run preview

# Run linter
npm run lint
```

The Markdown authoring tool is intentionally available only on the loopback-bound local development server at `/admin`. It is excluded from the production JavaScript bundle, and Cloudflare Pages returns `404` for the production `/admin` path.

## 🧪 Testing

This project uses [Vitest](https://vitest.dev/) for testing.

```sh
# Run all tests
npm run test

# Run tests in watch mode
npm run test:watch

# Run tests with UI
npm run test:ui

# Run tests with coverage report
npm run test:coverage
```

## 🛠️ Tech Stack

### Core
- **React 18.3.1** - UI library
- **TypeScript 5.8.3** - Type safety
- **Vite 5.4.19** - Build tool with SWC
- **React Router 6.30.1** - Client-side routing

### UI & Styling
- **shadcn/ui** - Component library (50+ components)
- **Tailwind CSS 3.4.17** - Utility-first CSS
- **Radix UI** - Accessible primitives
- **Lucide React** - Icon library

### Features
- **Markdown Support** - Full GitHub Flavored Markdown
- **Tags and Playlists** - Uniform searchable article feeds plus separate, explicitly assigned ordered playlists
- **SEO Optimized** - Sitemap, RSS, canonical URLs, Open Graph, and per-post structured data shells
- **Dark/Light Mode** - Theme switching with persistence
- **Performance** - Build-time content index, cache-first loading, code-splitting, memoization
- **Responsive** - Mobile-first design

### Testing
- **Vitest** - Fast unit testing
- **React Testing Library** - Component testing
- **jsdom** - DOM simulation

## 📁 Project Structure

```
├── public/
│   ├── blog-posts/          # Markdown blog posts
│   ├── blog-posts-index.json # Generated lightweight listing index
│   ├── blog-search-index.json # Generated lazy full-text search index
│   ├── blog-post-details/    # Generated per-route heading metadata
│   ├── sitemap.xml          # Generated SEO sitemap
│   └── rss.xml              # Generated RSS feed
├── src/
│   ├── components/          # Reusable components
│   │   ├── ui/             # shadcn/ui components
│   │   ├── BlogCard.tsx    # Blog post card
│   │   └── ...
│   ├── pages/              # Route components
│   │   ├── Index.tsx       # Homepage
│   │   ├── Blog.tsx        # Blog listing
│   │   ├── BlogPost.tsx    # Individual post
│   │   └── ...
│   ├── hooks/              # Custom React hooks
│   │   └── useSEO.tsx      # SEO management
│   ├── utils/              # Utility functions
│   │   └── markdownLoader.ts # Markdown parsing
│   ├── config/             # Configuration
│   │   └── tags.ts         # Blog tag configs
│   └── types/              # TypeScript types
└── tests/                  # Test files

```

## 🚀 Performance Features

This blog is optimized for scale:

- **Small Initial Index**: Cards load from a compact metadata file; body search and headings load on demand
- **Smart Caching**: 5-minute in-memory and edge revalidation windows reduce redundant loads
- **Code Splitting**: Markdown library loads only when needed
- **Lazy Loading**: Routes load on-demand
- **Static SEO Output**: Every known route has crawlable HTML, canonical metadata, and validated schema
- **Release Budgets**: Production builds fail on missing routes, duplicate metadata, oversized chunks, or payload regressions

## 🎨 Adding Custom Tags

Tags are defined in `src/config/tags.ts`. To add a new tag:

```typescript
export const TAG_CONFIGS: TagConfig = {
  "Your New Tag": {
    color: "bg-purple-500",    // Tailwind color class
    textColor: "text-white"     // Text color class
  }
};
```

Available tags: Docker, Kubernetes, CI/CD, DevOps, AWS, Azure, GCP, Terraform, Ansible, Jenkins, GitHub Actions, Linux, Networking, Security, Monitoring, Cloud, Containers

## 🌐 Deployment

Production runs on **Cloudflare Pages**. Use `npm run build` as the build command and `dist` as the output directory. Pages Functions in `functions/` provide newsletter, contact, and the production `/admin` denial route.

Required production secrets are configured in Cloudflare, never committed: `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`, `SHEETDB_API_URL`, and `TURNSTILE_SECRET_KEY`. The public `VITE_TURNSTILE_SITE_KEY` is supplied at build time.

The generated clean-URL HTML files cover every application route, so there is intentionally no catch-all 200 rewrite. Unknown URLs must remain real 404 responses.

`public/_routes.json` limits Function invocation to the newsletter, contact, and blocked admin routes. Static articles bypass Functions and remain cacheable static requests.

## 📚 Documentation

- **[HOW_TO_ADD_BLOG_POSTS.md](./HOW_TO_ADD_BLOG_POSTS.md)** - Complete guide to adding blog posts
- **[CLAUDE.md](./CLAUDE.md)** - Development documentation for Claude Code

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Run tests: `npm run test`
5. Build: `npm run build`
6. Submit a pull request

## 📄 License

This project was created with [Lovable](https://lovable.dev)

## 🔗 Links

- **Live Site**: https://techwithdikshant.com
- **Lovable Project**: https://lovable.dev/projects/a8eba7c3-86b0-4f77-b819-fc7ecaae7238
