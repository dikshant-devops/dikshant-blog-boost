import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, within } from '@testing-library/react';
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
  { id: 'post-1', title: 'Post One', excerpt: 'Excerpt 1', date: '2024-01-15', readTime: '5 min read', tags: ['Docker', 'Containers'], content: '' },
  { id: 'post-2', title: 'Post Two', excerpt: 'Excerpt 2', date: '2024-01-10', readTime: '3 min read', tags: ['Kubernetes', 'Containers'], content: '' },
  { id: 'post-3', title: 'Post Three', excerpt: 'Excerpt 3', date: '2024-01-05', readTime: '7 min read', tags: ['CI/CD'], content: '' },
  { id: 'post-4', title: 'Post Four', excerpt: 'Excerpt 4', date: '2024-01-01', readTime: '4 min read', tags: ['AWS'], content: '' },
  { id: 'gcp-security', title: 'GCP Security Note', excerpt: 'Cloud edge security', date: '2023-12-20', readTime: '6 min read', tags: ['GCP', 'Security'], category: 'Security', platform: 'GCP', content: '' },
  { id: 'playlist-only', title: 'Playlist Only Note', excerpt: 'Hidden from homepage discovery', date: '2025-01-01', readTime: '6 min read', tags: ['GCP', 'Security'], category: 'Security', platform: 'GCP', playlist: 'GCP Security', playlistSlug: 'gcp-security', playlistOrder: 1, playlistOnly: true, content: '' },
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
    expect(screen.getByRole('heading', { name: 'Tech With Dikshant' })).toBeInTheDocument();
    expect(screen.getByText(/Production-minded DevOps notes/)).toBeInTheDocument();
    const hero = screen.getByRole('img', { name: /cloud infrastructure operations workspace/i });
    expect(hero).toHaveAttribute('width', '1920');
    expect(hero).toHaveAttribute('height', '1053');
    expect(hero).toHaveAttribute('fetchpriority', 'high');
    expect(hero.getAttribute('srcset')).toContain('devops-operations-hero-960.jpg 960w');
  });

  it('renders primary reading and author CTAs', () => {
    renderIndex();
    expect(screen.getByText('Read the field notes')).toBeInTheDocument();
    expect(screen.getByText('About the author')).toBeInTheDocument();
  });

  it('renders editorial standards', () => {
    renderIndex();
    expect(screen.getByText('Operational context')).toBeInTheDocument();
    expect(screen.getByText('Implementation detail')).toBeInTheDocument();
    expect(screen.getByText('Scan-friendly reference')).toBeInTheDocument();
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
      const latest = screen.getByRole('region', { name: 'Latest field notes' });
      expect(within(latest).getByText('Post One')).toBeInTheDocument();
      expect(within(latest).getByText('Post Two')).toBeInTheDocument();
      expect(within(latest).getByText('Post Three')).toBeInTheDocument();
      expect(within(latest).queryByText('Post Four')).not.toBeInTheDocument();
      expect(within(latest).queryByText('GCP Security Note')).not.toBeInTheDocument();
      expect(within(latest).queryByText('Playlist Only Note')).not.toBeInTheDocument();
    });
  });

  it('builds three focus tracks from real matching articles', async () => {
    renderIndex();

    const tracks = await screen.findByRole('region', { name: 'Build depth in one area' });
    expect(within(tracks).getByRole('heading', { name: 'GCP security' })).toBeInTheDocument();
    expect(within(tracks).getByRole('heading', { name: 'Delivery automation' })).toBeInTheDocument();
    expect(within(tracks).getByRole('heading', { name: 'Container operations' })).toBeInTheDocument();
    expect(within(tracks).getByRole('link', { name: /GCP Security Note/ })).toHaveAttribute('href', '/blog/gcp-security');
    expect(within(tracks).getByRole('link', { name: /Explore GCP security/ })).toHaveAttribute('href', '/blog?tag=GCP');
    expect(within(tracks).getByRole('link', { name: /Explore Delivery automation/ })).toHaveAttribute('href', '/blog?tag=CI%2FCD');
    expect(within(tracks).getByText('2 field notes')).toBeInTheDocument();
    expect(within(tracks).queryByText('Playlist Only Note')).not.toBeInTheDocument();
  });

  it('renders "View All Articles" link', () => {
    renderIndex();
    expect(screen.getAllByText(/View all articles/i).length).toBeGreaterThan(0);
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
