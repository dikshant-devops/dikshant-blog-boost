# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Tech With Dikshant is a DevOps-focused blog platform built with React, TypeScript, and Vite. The blog uses a markdown-based content system and supports dark/light themes. Originally created with Lovable (low-code platform).

**Live URL**: https://techwithdikshant.com

## Tech Stack

- **Frontend**: React 18.3.1, TypeScript 5.8.3
- **Build Tool**: Vite 5.4.19 with SWC plugin
- **Routing**: React Router DOM 6.30.1 (client-side routing)
- **UI Components**: shadcn/ui (Radix UI primitives)
- **Styling**: Tailwind CSS 3.4.17
- **State**: TanStack Query 5.83.0
- **Content**: Markdown files with gray-matter for frontmatter parsing
- **Rendering**: react-markdown with remark-gfm (GitHub Flavored Markdown)

## Common Development Commands

```bash
# Install dependencies
npm install

# Start dev server (runs on http://localhost:8080)
npm run dev

# Production build
npm run build

# Development build
npm run build:dev

# Lint code
npm run lint

# Preview production build
npm run preview
```

## Project Structure

```
src/
├── components/
│   ├── ui/              # shadcn/ui components (51+ components)
│   ├── BlogCard.tsx     # Blog post display component
│   ├── Header.tsx       # Site navigation
│   ├── Footer.tsx
│   ├── Layout.tsx       # Page wrapper with Header/Footer
│   └── NewsletterSignup.tsx
├── pages/               # Route components (lazy-loaded)
│   ├── Index.tsx        # Homepage (/)
│   ├── Blog.tsx         # Blog listing (/blog)
│   ├── BlogPost.tsx     # Individual post (/blog/:id)
│   ├── About.tsx        # About page (/about)
│   ├── Connect.tsx      # Contact page (/connect)
│   ├── Newsletter.tsx   # Newsletter page (/newsletter)
│   ├── Admin.tsx        # Admin panel (/admin)
│   └── NotFound.tsx     # 404 page
├── hooks/
│   ├── useSEO.tsx       # Dynamic meta tags for SEO
│   ├── use-toast.ts     # Toast notifications
│   └── use-mobile.tsx   # Mobile detection
├── utils/
│   └── markdownLoader.ts  # Loads & parses markdown files
├── types/
│   └── blog.ts          # BlogPost interface
├── config/
│   └── tags.ts          # Blog tag configurations
├── lib/
│   └── utils.ts         # shadcn/ui utilities (cn helper)
├── App.tsx              # Main app with routes
├── main.tsx             # React entry point
└── index.css            # Global styles

public/
└── blog-posts/          # Markdown blog posts

functions/               # Serverless functions
└── newsletter-subscribe.js  # Newsletter API endpoint
```

## Key Architecture Details

### Routing & Code Splitting
- All route components are lazy-loaded using `React.lazy()` with Suspense boundaries
- Manual chunk splitting in vite.config.ts:
  - `vendor`: React, ReactDOM
  - `router`: React Router
  - `ui`: Radix UI components
  - `query`: TanStack Query
  - `icons`: Lucide React
  - `markdown`: react-markdown, remark-gfm

### Content Management (Markdown-Based)

Blog posts are stored as `.md` files in `/public/blog-posts/`. The system auto-discovers posts using Vite's `import.meta.glob()`.

**Frontmatter format** (optional, auto-generated if missing):
```yaml
---
title: "Post Title"
excerpt: "Short description"
date: "2024-01-20"
readTime: "10 min read"
tags: ["Docker", "DevOps"]
---
```

**Auto-generation features**:
- Title: Extracted from first H1 heading or filename
- Excerpt: First paragraph or first 150 characters
- Date: Current date if not specified
- Read Time: Calculated from word count (200 WPM)
- Tags: Auto-detected from content and filename

**Adding a new blog post**:
1. Create a new `.md` file in `/public/blog-posts/`
2. Add frontmatter (optional)
3. Write content in markdown
4. Post automatically appears on `/blog` page

### SEO Implementation

The `useSEO` hook (in `src/hooks/useSEO.tsx`) handles dynamic meta tags:
- Page title and description
- Open Graph tags (og:title, og:description, og:image)
- Twitter Card tags
- Canonical URLs
- JSON-LD structured data for articles

**Usage in pages**:
```tsx
useSEO({
  title: "Page Title",
  description: "Page description",
  image: "https://example.com/image.jpg",
  url: "https://techwithdikshant.com/page",
  type: "article",
  publishedTime: "2024-01-20",
  tags: ["DevOps", "Docker"]
});
```

### Theme System
- Uses `next-themes` for dark/light mode toggle
- System preference detection
- Theme persisted in localStorage
- Theme toggle in Header component

### TypeScript Configuration
The project uses **lenient TypeScript settings**:
- `noImplicitAny: false`
- `strictNullChecks: false`
- `noUnusedLocals: false`

Path alias configured: `@/` → `./src/`

When adding new code, maintain consistency with existing style but consider enabling stricter checks for critical code.

## Deployment

The project supports multiple deployment targets:

### Netlify (Primary)
- Configuration: `netlify.toml`
- Build command: `npm run build`
- Publish directory: `dist`
- SPA redirects configured
- Serverless functions in `/functions/`

### GitHub Pages
- Configuration: `.github/workflows/deploy.yml`
- Automated deployment on push to `main` branch
- Uses GitHub Actions

### Cloudflare Pages
- Configuration: `wrangler.toml`
- Functions directory supported

## Important Files

- `vite.config.ts` - Build configuration, plugins, path aliases, chunk splitting
- `tailwind.config.ts` - Tailwind theme customization (colors, animations)
- `components.json` - shadcn/ui configuration (style, tailwind, aliases)
- `tsconfig.json` - TypeScript settings (lenient mode)
- `eslint.config.js` - ESLint rules for TypeScript + React
- `src/utils/markdownLoader.ts` - Core content loading logic
- `src/config/tags.ts` - Blog tag definitions and colors

## Component Conventions

### shadcn/ui Components
- Located in `src/components/ui/`
- Use `cn()` utility from `src/lib/utils.ts` for className merging
- Follow shadcn/ui patterns for composition

### Page Components
- All pages wrapped in `<Layout>` component
- Use `useSEO` hook at top of component
- Lazy-loaded via `React.lazy()` in App.tsx

### Custom Hooks
- Prefix with `use` (React convention)
- Located in `src/hooks/`

## Testing

**Current Status**: No testing framework is currently configured.

**Recommended Setup**:
- Unit tests: Vitest (native Vite support)
- Component tests: React Testing Library
- E2E tests: Playwright or Cypress

## Known Conventions

1. **Blog Post IDs**: Derived from markdown filename (without `.md` extension)
2. **Tag Colors**: Defined in `src/config/tags.ts` - add new tags there for consistent styling
3. **Images**: Store in `/public/` directory, reference with absolute paths
4. **Newsletter**: Uses Beehiiv iframe embed on newsletter page
5. **Admin Panel**: Located at `/admin` route (no authentication currently)

## Build Output

- Production builds go to `dist/`
- Assets are hashed for cache busting
- Source maps not included in production builds
- Manual chunk splitting ensures optimal loading performance
