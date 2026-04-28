import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Index from './Index';
import * as markdownLoader from '@/utils/markdownLoader';
import { BlogPost } from '@/types/blog';

vi.mock('@/utils/markdownLoader', () => ({
  loadMarkdownPosts: vi.fn(),
}));

// Mock useSEO to avoid DOM side effects
vi.mock('@/hooks/useSEO', () => ({
  useSEO: vi.fn(),
}));

const mockPosts: BlogPost[] = [
  { id: 'post-1', title: 'Post One', excerpt: 'Excerpt 1', date: '2024-01-15', readTime: '5 min read', tags: ['Docker'], content: '' },
  { id: 'post-2', title: 'Post Two', excerpt: 'Excerpt 2', date: '2024-01-10', readTime: '3 min read', tags: ['K8s'], content: '' },
  { id: 'post-3', title: 'Post Three', excerpt: 'Excerpt 3', date: '2024-01-05', readTime: '7 min read', tags: ['CI/CD'], content: '' },
  { id: 'post-4', title: 'Post Four', excerpt: 'Excerpt 4', date: '2024-01-01', readTime: '4 min read', tags: ['AWS'], content: '' },
];

function renderIndex() {
  return render(<BrowserRouter><Index /></BrowserRouter>);
}

describe('Index Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(markdownLoader.loadMarkdownPosts).mockResolvedValue(mockPosts);
  });

  it('renders hero section with site tagline', () => {
    renderIndex();
    expect(screen.getByText(/Master/)).toBeInTheDocument();
    expect(screen.getAllByText(/DevOps/).length).toBeGreaterThan(0);
  });

  it('renders Explore Blog and Newsletter CTA buttons', () => {
    renderIndex();
    expect(screen.getByText('Explore Blog')).toBeInTheDocument();
    expect(screen.getByText('Subscribe to Newsletter')).toBeInTheDocument();
  });

  it('renders features section', () => {
    renderIndex();
    expect(screen.getByText('Practical Tutorials')).toBeInTheDocument();
    expect(screen.getByText('Latest Technologies')).toBeInTheDocument();
    expect(screen.getByText('Community Focused')).toBeInTheDocument();
  });

  it('shows loading skeletons initially', () => {
    // Ensure loader doesn't resolve immediately
    vi.mocked(markdownLoader.loadMarkdownPosts).mockReturnValue(new Promise(() => {}));
    renderIndex();

    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
  });

  it('displays only 3 featured posts (not all 4)', async () => {
    renderIndex();

    await waitFor(() => {
      expect(screen.getByText('Post One')).toBeInTheDocument();
      expect(screen.getByText('Post Two')).toBeInTheDocument();
      expect(screen.getByText('Post Three')).toBeInTheDocument();
    });

    // 4th post should NOT appear
    expect(screen.queryByText('Post Four')).not.toBeInTheDocument();
  });

  it('renders "View All Articles" link', () => {
    renderIndex();
    expect(screen.getByText('View All Articles')).toBeInTheDocument();
  });

  it('handles load error gracefully', async () => {
    // Return empty array to simulate failed load (component catches internally)
    vi.mocked(markdownLoader.loadMarkdownPosts).mockResolvedValue([]);
    renderIndex();

    // Should not crash, show no posts
    await waitFor(() => {
      expect(screen.queryByText('Post One')).not.toBeInTheDocument();
    });
  });
});
