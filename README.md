# Tech With Dikshant - DevOps Blog

A modern, high-performance blog platform focused on DevOps tutorials and best practices.

**Live URL**: https://techwithdikshant.com

## 🚀 Quick Start

### Prerequisites
- Node.js 18+ and npm installed - [install with nvm](https://github.com/nvm-sh/nvm#installing-and-updating)

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
2. Add frontmatter (optional - auto-generated if missing)
3. Write your content in Markdown
4. Save - it appears automatically!

**Example**:
```markdown
---
title: "My DevOps Tutorial"
excerpt: "Learn Docker and Kubernetes"
date: "2024-01-20"
readTime: "5 min read"
tags: ["Docker", "Kubernetes"]
---

# My Tutorial Content

Your blog post content here...
```

## 🛠️ Development Commands

```sh
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Run linter
npm run lint
```

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

**Current Test Coverage**: 10/10 component tests passing

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
- **SEO Optimized** - Meta tags, Open Graph, structured data
- **Dark/Light Mode** - Theme switching with persistence
- **Performance** - Intelligent caching, code-splitting, memoization
- **Responsive** - Mobile-first design

### Testing
- **Vitest** - Fast unit testing
- **React Testing Library** - Component testing
- **jsdom** - DOM simulation

## 📁 Project Structure

```
├── public/
│   └── blog-posts/          # Markdown blog posts
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

- **Smart Caching**: 5-minute cache reduces redundant loads
- **Code Splitting**: Markdown library loads only when needed
- **Memoization**: Prevents unnecessary re-renders
- **Lazy Loading**: Routes load on-demand
- **Optimized SEO**: Batched DOM operations

**Scalability**: Handles 1000+ blog posts efficiently with cache-first architecture.

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

This project is configured for multiple deployment platforms:

- **Netlify** (Primary) - See `netlify.toml`
- **GitHub Pages** - See `.github/workflows/deploy.yml`
- **Cloudflare Pages** - See `wrangler.toml`

### Deploy to Netlify
```sh
npm run build
# Deploy the dist/ folder
```

### Deploy to GitHub Pages
Push to main branch - automated via GitHub Actions

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
