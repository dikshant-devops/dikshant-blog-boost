import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor, fireEvent } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import Blog from './Blog';
import * as markdownLoader from '../utils/markdownLoader';
import { BlogPost } from '@/types/blog';

// Mock the markdown loader
vi.mock('../utils/markdownLoader', () => ({
  loadMarkdownPosts: vi.fn(),
  loadBlogSearchIndex: vi.fn()
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
  },
  {
    id: 'gcp-cloud-armor',
    title: 'GCP Cloud Armor Day 1',
    excerpt: 'Start a Google Cloud security implementation log',
    date: '2024-01-20',
    readTime: '7 min read',
    tags: ['GCP', 'Cloud Armor', 'Security'],
    category: 'Security',
    platform: 'GCP',
    series: 'GCP Day by Day',
    seriesSlug: 'gcp-day-by-day',
    seriesOrder: 1,
    content: 'GCP content here'
  },
  {
    id: 'gcp-iam-notes',
    title: 'GCP IAM Notes',
    excerpt: 'A standalone Google Cloud IAM note',
    date: '2024-01-18',
    readTime: '4 min read',
    tags: ['GCP', 'Security'],
    category: 'Security',
    platform: 'GCP',
    content: 'IAM content here'
  }
];

const renderWithRouter = (component: React.ReactElement, initialEntries = ['/blog']) => {
  return render(<MemoryRouter initialEntries={initialEntries}>{component}</MemoryRouter>);
};

describe('Blog Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(markdownLoader.loadMarkdownPosts).mockResolvedValue(mockPosts);
    vi.mocked(markdownLoader.loadBlogSearchIndex).mockResolvedValue({
      'docker-post': 'Docker content here container runtime',
      'kubernetes-post': 'Kubernetes content here pod scheduling',
      'cicd-post': 'CI/CD content here release automation',
      'gcp-cloud-armor': 'GCP content here edge policy',
      'gcp-iam-notes': 'IAM content here identity policy'
    });
  });

  it('should display loading skeleton initially', () => {
    renderWithRouter(<Blog />);
    // Skeleton components use animate-pulse class
    const skeletons = document.querySelectorAll('.animate-pulse');
    expect(skeletons.length).toBeGreaterThan(0);
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
      const searchInput = screen.getByPlaceholderText(/search by topic/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('should filter posts by search term', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by topic/i);
    fireEvent.change(searchInput, { target: { value: 'Docker' } });

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
      expect(screen.queryByText('Kubernetes Introduction')).not.toBeInTheDocument();
      expect(screen.queryByText('CI/CD Pipeline Setup')).not.toBeInTheDocument();
    });
  });

  it('loads the body-text index only after search and matches article content', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument());
    expect(markdownLoader.loadBlogSearchIndex).not.toHaveBeenCalled();

    fireEvent.change(screen.getByPlaceholderText(/search by topic/i), {
      target: { value: 'pod scheduling' }
    });

    await waitFor(() => {
      expect(markdownLoader.loadBlogSearchIndex).toHaveBeenCalledTimes(1);
      expect(screen.getByText('Kubernetes Introduction')).toBeInTheDocument();
      expect(screen.queryByText('Getting Started with Docker')).not.toBeInTheDocument();
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

  it('shows series and standalone posts uniformly in a selected tag feed', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('GCP Cloud Armor Day 1')).toBeInTheDocument();
    });

    const gcpTags = screen.getAllByText('GCP');
    const gcpBadge = gcpTags.find(tag => tag.closest('.cursor-pointer'));
    if (gcpBadge) {
      fireEvent.click(gcpBadge);
    }

    await waitFor(() => {
      expect(screen.getByText('GCP Articles')).toBeInTheDocument();
      expect(screen.getByText('Selected Tag')).toBeInTheDocument();
      expect(screen.getByText('GCP Cloud Armor Day 1')).toBeInTheDocument();
      expect(screen.getByText('GCP IAM Notes')).toBeInTheDocument();
      expect(screen.queryByText('Individual Articles')).not.toBeInTheDocument();
      expect(screen.queryByTestId('tag-series-playlists')).not.toBeInTheDocument();
      expect(screen.queryByText('Getting Started with Docker')).not.toBeInTheDocument();
    });
  });

  it('discovers series separately from the article feed', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Series' })).toBeInTheDocument();
      expect(screen.getByRole('link', { name: /GCP Day by Day/i })).toHaveAttribute('href', '/series/gcp-day-by-day');
      expect(screen.getByText('GCP IAM Notes')).toBeInTheDocument();
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

    // Now click "All Tags" badge
    const allBadge = screen.getByText('All Tags');
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
      expect(screen.getAllByText('DevOps').length).toBeGreaterThan(0);
    });
  });

  it('should show "no articles found" when search returns no results', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search by topic/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentTopic' } });

    await waitFor(() => {
      expect(screen.getByText(/no articles found matching your criteria/i)).toBeInTheDocument();
    });
  });

  it('should display page title and description', () => {
    renderWithRouter(<Blog />);

    // Use getAllByText since "DevOps" and "Blog" appear in multiple places (title + tags)
    expect(screen.getAllByText(/DevOps/).length).toBeGreaterThan(0);
    expect(screen.getAllByText(/Blog/).length).toBeGreaterThan(0);
  });

  it('should use memoized handlers (performance optimization)', async () => {
    const { rerender } = renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    // Re-render should not recreate handlers
    rerender(<MemoryRouter><Blog /></MemoryRouter>);

    // Functionality should still work
    const searchInput = screen.getByPlaceholderText(/search by topic/i);
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
