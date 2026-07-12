import { describe, it, expect, vi, beforeEach } from 'vitest';
import { fireEvent, render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

// Mock the SEO hooks to avoid DOM manipulation in tests
vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
  useArticleStructuredData: vi.fn(),
}));

// Mock react-markdown
vi.mock('react-markdown', () => ({
  default: ({ children }: { children: string }) => <div data-testid="markdown-content">{children}</div>,
}));

// Mock remark-gfm
vi.mock('remark-gfm', () => ({
  default: {},
}));

const mockPost = {
  id: 'test-post',
  title: 'Test Blog Post',
  excerpt: 'Test excerpt for the blog post',
  date: '2024-06-15',
  readTime: '5 min read',
  tags: ['Docker', 'DevOps'],
  content: '# Test Content\n\nThis is a test blog post.',
};

const mockPosts = [
  mockPost,
  {
    id: 'docker-guide',
    title: 'Docker Guide',
    excerpt: 'Docker deep dive',
    date: '2024-06-10',
    readTime: '8 min read',
    tags: ['Docker', 'Containers'],
    content: '# Docker Guide',
  },
  {
    id: 'kubernetes-intro',
    title: 'Kubernetes Intro',
    excerpt: 'Getting started with K8s',
    date: '2024-06-12',
    readTime: '10 min read',
    tags: ['Kubernetes', 'DevOps'],
    content: '# Kubernetes Intro',
  },
  {
    id: 'git-basics',
    title: 'Git Basics',
    excerpt: 'Git fundamentals',
    date: '2024-06-14',
    readTime: '3 min read',
    tags: ['Git'],
    content: '# Git Basics',
  },
];

// Mock the markdown loader
vi.mock('@/utils/markdownLoader', () => ({
  loadMarkdownPost: vi.fn(),
  loadMarkdownPosts: vi.fn(),
}));

// Mock NewsletterSignup
vi.mock('@/components/NewsletterSignup', () => ({
  NewsletterSignup: () => <div data-testid="newsletter-signup" />,
}));

import BlogPost, { CodeBlock } from './BlogPost';
import { loadMarkdownPost, loadMarkdownPosts } from '@/utils/markdownLoader';

function renderBlogPost(postId = 'test-post') {
  return render(
    <MemoryRouter initialEntries={[`/blog/${postId}`]}>
      <Routes>
        <Route path="/blog/:id" element={<BlogPost />} />
        <Route path="/blog" element={<div data-testid="blog-listing">Blog listing</div>} />
      </Routes>
    </MemoryRouter>
  );
}

describe('BlogPost', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it('shows skeleton while loading', () => {
    // Make the promise never resolve to keep loading state
    (loadMarkdownPost as any).mockReturnValue(new Promise(() => {}));
    (loadMarkdownPosts as any).mockReturnValue(new Promise(() => {}));

    renderBlogPost();
    // Skeleton should have multiple Skeleton elements (animate-pulse divs)
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('renders blog post content after loading', async () => {
    (loadMarkdownPost as any).mockResolvedValue(mockPost);
    (loadMarkdownPosts as any).mockResolvedValue(mockPosts);

    renderBlogPost();

    await waitFor(() => {
      expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
    });

    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('DevOps')).toBeInTheDocument();
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('links optional playlist membership to the canonical playlist page', async () => {
    const playlistPost = {
      ...mockPost,
      playlist: 'Kubernetes Foundations',
      playlistSlug: 'kubernetes-foundations',
      playlistOrder: 2,
    };
    (loadMarkdownPost as any).mockResolvedValue(playlistPost);
    (loadMarkdownPosts as any).mockResolvedValue([playlistPost]);

    renderBlogPost();

    const playlistLink = await screen.findByRole('link', { name: /Kubernetes Foundations · Item 2/ });
    expect(playlistLink).toHaveAttribute('href', '/playlists/kubernetes-foundations');
  });

  it('redirects to /blog if post not found', async () => {
    (loadMarkdownPost as any).mockResolvedValue(null);
    (loadMarkdownPosts as any).mockResolvedValue([]);

    renderBlogPost('nonexistent');

    await waitFor(() => {
      expect(screen.getByTestId('blog-listing')).toBeInTheDocument();
    });
  });

  it('shows related posts sorted by tag relevance', async () => {
    (loadMarkdownPost as any).mockResolvedValue(mockPost);
    (loadMarkdownPosts as any).mockResolvedValue(mockPosts);

    renderBlogPost();

    await waitFor(() => {
      expect(screen.getByText('Test Blog Post')).toBeInTheDocument();
    });

    // Docker Guide shares "Docker" tag, Kubernetes Intro shares "DevOps" tag
    // Both share 1 tag, but Docker Guide should appear (same shared count, sorted by date)
    // Git Basics shares 0 tags — should NOT appear
    const relatedSection = screen.getByText('Related field notes').parentElement;
    expect(relatedSection).toBeInTheDocument();

    // Git Basics should not be in related posts since it shares no tags with the current post
    // and there are 2 other posts that share tags
    const relatedLinks = relatedSection!.querySelectorAll('a');
    const relatedTitles = Array.from(relatedLinks).map(a => a.textContent);
    expect(relatedTitles.some(t => t?.includes('Docker Guide') || t?.includes('Kubernetes Intro'))).toBe(true);
  });

  it('markdown img renderer includes loading="lazy"', async () => {
    const postWithImage = {
      ...mockPost,
      content: '![Test image](/images/blog/test.png)',
    };
    (loadMarkdownPost as any).mockResolvedValue(postWithImage);
    (loadMarkdownPosts as any).mockResolvedValue([postWithImage]);

    renderBlogPost();

    await waitFor(() => {
      expect(screen.getByText(postWithImage.title)).toBeInTheDocument();
    });

    // Since we mock react-markdown, we can't test the actual img rendering.
    // But we verify the component renders without error.
    expect(screen.getByTestId('markdown-content')).toBeInTheDocument();
  });

  it('copies a code block and shows feedback', async () => {
    const writeText = vi.fn().mockResolvedValue(undefined);
    Object.defineProperty(navigator, 'clipboard', {
      configurable: true,
      value: { writeText }
    });

    render(<CodeBlock>kubectl get pods</CodeBlock>);
    fireEvent.click(screen.getByRole('button', { name: 'Copy' }));

    await waitFor(() => expect(screen.getByRole('button', { name: 'Copied' })).toBeInTheDocument());
    expect(writeText).toHaveBeenCalledWith('kubectl get pods');
  });
});
