# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tech With Dikshant is a DevOps-focused blog platform built with React, TypeScript, and Vite. Uses a markdown-based content system with dark/light theme support. Originally created with Lovable.

**Live URL**: https://techwithdikshant.com

## Tech Stack

- **Frontend**: React 18, TypeScript, Vite (SWC plugin)
- **UI**: shadcn/ui (Radix UI primitives), Tailwind CSS
- **Routing**: React Router DOM (client-side, lazy-loaded routes)
- **State/Data**: TanStack Query with 5-min stale time
- **Content**: Markdown files parsed with custom loader (no gray-matter at runtime — frontmatter parsed via regex in `src/utils/markdownLoader.ts`)
- **Rendering**: react-markdown with remark-gfm

## Commands

```bash
npm run dev              # Dev server on http://localhost:8080
npm run build            # Production build → dist/
npm run build:dev        # Development build
npm run lint             # ESLint
npm run test             # Run all tests once (vitest run)
npm run test:watch       # Watch mode
npm run test:coverage    # Coverage report (v8 provider)

# Run a single test file
npx vitest run src/components/BlogCard.test.tsx

# Regenerate blog post manifest after adding new .md files
node scripts/generate-blog-manifest.js

# Cross-post to external platforms
npm run cross-post
```

## Architecture

### Content Pipeline

Blog posts are `.md` files in `/public/blog-posts/`. The loading flow:

1. `src/utils/markdownLoader.ts` fetches `/blog-posts-manifest.json` (a JSON array of filenames)
2. Each file is fetched and parsed: frontmatter via regex, then auto-generation of missing fields (title from H1/filename, excerpt from first paragraph, date, read time at 200 WPM, tags from content matching `src/config/tags.ts`)
3. Results are cached in a module-level variable for 5 minutes (separate from TanStack Query's own cache)
4. Post IDs are derived from filename: `.md` stripped, special chars → dashes, lowercased
5. Single-post loading (`loadMarkdownPost`) tries multiple filename variations (dashes, underscores, spaces, title-case) before falling back to loading all posts

**Manifest must be manually updated** when adding posts — run `node scripts/generate-blog-manifest.js` or edit `/public/blog-posts-manifest.json` directly.

**Fallback**: If manifest fetch fails, a hardcoded list in `markdownLoader.ts:39` is used.

### Routing

All routes defined in `src/App.tsx`. Every page component is lazy-loaded via `React.lazy()`.

**IMPORTANT**: New routes must be added BEFORE the catch-all `*` route (NotFound). See the comment in App.tsx.

Provider hierarchy: `BrowserRouter` → `QueryClientProvider` → `ThemeProvider` (next-themes, default dark) → `TooltipProvider` → `Layout` → `Suspense` → `Routes`

### Page Components

Every page is wrapped in `<Layout>` (Header + Footer) and calls `useSEO()` at the top for meta tags, Open Graph, Twitter Cards, and canonical URLs. Article pages also use `useArticleStructuredData()` for JSON-LD.

### Styling

- shadcn/ui components in `src/components/ui/` — use `cn()` from `src/lib/utils.ts` for className merging
- Tailwind CSS with custom theme in `tailwind.config.ts`
- Dark/light mode via `next-themes` with `attribute="class"`

### Build Configuration

`vite.config.ts` has manual chunk splitting (vendor, router, ui, query, icons, markdown). The `base` path changes for GitHub Pages deployments (checks `GITHUB_REPOSITORY` env var). `lovable-tagger` plugin runs in dev mode only.

## Adding a Blog Post

1. Create `.md` file in `/public/blog-posts/` (frontmatter optional — all fields auto-generated if missing)
2. Run `node scripts/generate-blog-manifest.js` to update the manifest
3. Images go in `/public/images/blog/`, referenced as `/images/blog/filename.png`

Frontmatter format:
```yaml
---
title: "Post Title"
excerpt: "Short description"
date: "2024-01-20"
readTime: "10 min read"
tags: ["Docker", "DevOps"]
---
```

## Tag System

Tags are defined in `src/config/tags.ts` as a `Record<string, TagConfig>` with `name` and `description` fields. Auto-detection in `markdownLoader.ts` checks content/filename against these keys, plus special cases (e.g., "k8s" → Kubernetes, "cicd"/"ci-cd" → CI/CD).

## TypeScript

Lenient settings — `noImplicitAny: false`, `strictNullChecks: false`, `noUnusedLocals: false`. Path alias: `@/` → `./src/`.

## Testing

Vitest with jsdom environment and React Testing Library. Setup file: `src/test/setup.ts`. Test files live next to source files with `.test.ts`/`.test.tsx` extension.

## Deployment

- **Netlify** (primary): `netlify.toml` — SPA redirects configured, serverless functions in `/functions/`
- **GitHub Pages**: `.github/workflows/deploy.yml` — auto-deploys on push to `main`
- **Cloudflare Pages**: `wrangler.toml`

## Key Files

- `src/utils/markdownLoader.ts` — Core content loading, parsing, and caching logic
- `src/config/tags.ts` — Blog tag definitions (add new tags here)
- `src/hooks/useSEO.tsx` — SEO meta tags and structured data hooks
- `src/App.tsx` — Route definitions and provider setup
- `functions/newsletter-subscribe.js` — Beehiiv newsletter API (serverless)
- `scripts/generate-blog-manifest.js` — Scans `/public/blog-posts/` and writes manifest JSON
- `scripts/cross-post.js` — Cross-posting to Dev.to, Medium, LinkedIn, Twitter
