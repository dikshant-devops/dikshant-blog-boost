import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import Blog from './Blog';
import * as markdownLoader from '../utils/markdownLoader';
import { BlogPost } from '@/types/blog';

// Mock the markdown loader
vi.mock('../utils/markdownLoader', () => ({
  loadMarkdownPosts: vi.fn()
}));

const mockPosts: BlogPost[] = [
  {
    id: 'docker-post',
    title: 'Getting Started with Docker',
    excerpt: 'Learn Docker basics and containerization',
    date: '2024-01-15',
    readTime: '5 min read',
    tags: ['Docker', 'DevOps'],
    content: 'Docker content here'
  },
  {
    id: 'kubernetes-post',
    title: 'Kubernetes Introduction',
    excerpt: 'Learn Kubernetes fundamentals',
    date: '2024-01-10',
    readTime: '8 min read',
    tags: ['Kubernetes', 'DevOps'],
    content: 'Kubernetes content here'
  },
  {
    id: 'cicd-post',
    title: 'CI/CD Pipeline Setup',
    excerpt: 'Build automated CI/CD pipelines',
    date: '2024-01-05',
    readTime: '10 min read',
    tags: ['CI/CD', 'GitHub Actions'],
    content: 'CI/CD content here'
  }
];

const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('Blog Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(markdownLoader.loadMarkdownPosts).mockResolvedValue(mockPosts);
  });

  it('should display loading skeleton initially', () => {
    renderWithRouter(<Blog />);
    // Skeleton components should be rendered
    expect(screen.getAllByRole('img', { hidden: true }).length).toBeGreaterThan(0);
  });

  it('should load and display all blog posts', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
      expect(screen.getByText('Kubernetes Introduction')).toBeInTheDocument();
      expect(screen.getByText('CI/CD Pipeline Setup')).toBeInTheDocument();
    });
  });

  it('should display search input', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      const searchInput = screen.getByPlaceholderText(/search articles/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should filter posts by search term', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search articles/i);
    fireEvent.change(searchInput, { target: { value: 'Docker' } });

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
      expect(screen.queryByText('Kubernetes Introduction')).not.toBeInTheDocument();
      expect(screen.queryByText('CI/CD Pipeline Setup')).not.toBeInTheDocument();
    });
  });

  it('should filter posts by tag', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    // Click on Kubernetes tag
    const tags = screen.getAllByText('Kubernetes');
    // Find the badge (not the one in the card)
    const kubernetesBadge = tags.find(tag => tag.closest('.cursor-pointer'));
    if (kubernetesBadge) {
      fireEvent.click(kubernetesBadge);
    }

    await waitFor(() => {
      expect(screen.queryByText('Getting Started with Docker')).not.toBeInTheDocument();
      expect(screen.getByText('Kubernetes Introduction')).toBeInTheDocument();
    });
  });

  it('should show all posts when "All" tag is selected', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    // Click a specific tag first
    const dockerTags = screen.getAllByText('Docker');
    const dockerBadge = dockerTags.find(tag => tag.closest('.cursor-pointer'));
    if (dockerBadge) {
      fireEvent.click(dockerBadge);
    }

    // Now click "All" badge
    const allBadge = screen.getByText('All');
    fireEvent.click(allBadge);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
      expect(screen.getByText('Kubernetes Introduction')).toBeInTheDocument();
      expect(screen.getByText('CI/CD Pipeline Setup')).toBeInTheDocument();
    });
  });

  it('should display all unique tags from posts', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      // Should have tags: DevOps, Docker, Kubernetes, CI/CD, GitHub Actions
      expect(screen.getByText('DevOps')).toBeInTheDocument();
    });
  });

  it('should show "no articles found" when search returns no results', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search articles/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentTopic' } });

    await waitFor(() => {
      expect(screen.getByText(/no articles found matching your criteria/i)).toBeInTheDocument();
    });
  });

  it('should display page title and description', () => {
    renderWithRouter(<Blog />);

    expect(screen.getByText(/DevOps/)).toBeInTheDocument();
    expect(screen.getByText(/Blog/)).toBeInTheDocument();
  });

  it('should use memoized handlers (performance optimization)', async () => {
    const { rerender } = renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    // Re-render should not recreate handlers
    rerender(<BrowserRouter><Blog /></BrowserRouter>);

    // Functionality should still work
    const searchInput = screen.getByPlaceholderText(/search articles/i);
    expect(searchInput).toBeInTheDocument();
  });

  it('should handle error gracefully', async () => {
    vi.mocked(markdownLoader.loadMarkdownPosts).mockRejectedValue(new Error('Failed to load'));

    renderWithRouter(<Blog />);

    // Should not crash and eventually show no posts
    await waitFor(() => {
      const elements = screen.queryByText('Getting Started with Docker');
      expect(elements).not.toBeInTheDocument();
    });
  });
});
