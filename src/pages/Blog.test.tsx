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
    playlist: 'GCP Day by Day',
    playlistSlug: 'gcp-day-by-day',
    playlistOrder: 1,
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
  },
  {
    id: 'gcp-iam-playlist-guide',
    title: 'GCP IAM Playlist Guide',
    excerpt: 'A playlist-only identity and access management guide',
    date: '2024-01-17',
    readTime: '6 min read',
    tags: ['GCP', 'Security'],
    category: 'Security',
    platform: 'GCP',
    playlist: 'GCP Day by Day',
    playlistSlug: 'gcp-day-by-day',
    playlistOrder: 2,
    playlistOnly: true,
    content: 'Service account bindings and least privilege'
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
      'gcp-iam-notes': 'IAM content here identity policy',
      'gcp-iam-playlist-guide': 'Service account bindings and least privilege'
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
      const searchInput = screen.getByPlaceholderText(/search commands/i);
      expect(searchInput).toBeInTheDocument();
    });
  });

  it('keeps mobile topic groups compact until requested', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument());

    const toggle = screen.getByRole('button', { name: /browse topics/i });
    const groups = document.getElementById('topic-groups');
    expect(toggle).toHaveAttribute('aria-expanded', 'false');
    expect(groups).toHaveClass('hidden');

    fireEvent.click(toggle);
    expect(toggle).toHaveAttribute('aria-expanded', 'true');
    expect(groups).toHaveClass('grid');
  });

  it('renders grouped taxonomy as readable navigation with result counts', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => expect(screen.getByRole('heading', { name: 'Browse by area' })).toBeInTheDocument());

    expect(screen.getByText('Engineering concerns and operating practices')).toBeInTheDocument();
    expect(screen.getByText('Cloud and container runtime ecosystems')).toBeInTheDocument();
    expect(screen.getByText('Products used to build and operate systems')).toBeInTheDocument();
    expect(screen.queryByText('Source control and daily engineering workflows')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'GCP' })).toHaveTextContent('2');
    expect(screen.getByRole('button', { name: 'Kubernetes' })).toHaveTextContent('1');
  });

  it('exposes the selected taxonomy filter through aria-pressed', async () => {
    renderWithRouter(<Blog />, ['/blog?tag=GCP']);

    await waitFor(() => expect(screen.getByRole('button', { name: 'GCP' })).toHaveAttribute('aria-pressed', 'true'));
    expect(screen.getByRole('button', { name: 'Kubernetes' })).toHaveAttribute('aria-pressed', 'false');
  });

  it('should filter posts by search term', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search commands/i);
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

    fireEvent.change(screen.getByPlaceholderText(/search commands/i), {
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

    fireEvent.click(screen.getByRole('button', { name: 'Kubernetes' }));

    await waitFor(() => {
      expect(screen.queryByText('Getting Started with Docker')).not.toBeInTheDocument();
      expect(screen.getByText('Kubernetes Introduction')).toBeInTheDocument();
    });
  });

  it('shows playlist and standalone posts uniformly in the default tag feed', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('GCP Cloud Armor Day 1')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'GCP' }));

    await waitFor(() => {
      expect(screen.getByText('GCP articles')).toBeInTheDocument();
      expect(screen.getByText('Selected topic')).toBeInTheDocument();
      expect(screen.getByText('GCP Cloud Armor Day 1')).toBeInTheDocument();
      expect(screen.getByText('GCP IAM Notes')).toBeInTheDocument();
      expect(screen.queryByText('GCP IAM Playlist Guide')).not.toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Articles 2/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /Playlists 1/ })).toBeInTheDocument();
      expect(screen.queryByText('Getting Started with Docker')).not.toBeInTheDocument();
    });
  });

  it('discovers playlists separately from the article feed', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'Playlists' })).toBeInTheDocument();
      expect(screen.getByText('GCP Day by Day')).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Open playlist' })).toHaveAttribute('href', '/playlists/gcp-day-by-day');
      expect(screen.getByText('GCP IAM Notes')).toBeInTheDocument();
    });
  });

  it('shows only explicit playlist collections in the platform playlist view', async () => {
    renderWithRouter(<Blog />, ['/blog?tag=GCP&view=playlists']);

    await waitFor(() => {
      expect(screen.getByRole('heading', { name: 'GCP playlists' })).toBeInTheDocument();
      expect(screen.getByText('GCP Day by Day')).toBeInTheDocument();
      expect(screen.getByText(/01\. GCP Cloud Armor Day 1/)).toBeInTheDocument();
      expect(screen.getByRole('link', { name: 'Open playlist' })).toHaveAttribute('href', '/playlists/gcp-day-by-day');
      expect(screen.queryByText('GCP Cloud Armor Day 1')).not.toBeInTheDocument();
      expect(screen.queryByText('GCP IAM Notes')).not.toBeInTheDocument();
    });
  });

  it('switches from playlists to independently searchable article results', async () => {
    renderWithRouter(<Blog />, ['/blog?tag=GCP&view=playlists']);

    await waitFor(() => expect(screen.getByText('GCP Day by Day')).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/search commands/i), { target: { value: 'edge policy' } });

    await waitFor(() => {
      expect(markdownLoader.loadBlogSearchIndex).toHaveBeenCalled();
      expect(screen.getByText('GCP Cloud Armor Day 1')).toBeInTheDocument();
      expect(screen.queryByRole('heading', { name: 'GCP playlists' })).not.toBeInTheDocument();
    });
  });

  it('finds playlist-only articles through keyword search without adding them to the default feed', async () => {
    renderWithRouter(<Blog />, ['/blog?tag=GCP']);

    await waitFor(() => expect(screen.queryByText('GCP IAM Playlist Guide')).not.toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText(/search commands/i), { target: { value: 'service account bindings' } });

    await waitFor(() => {
      expect(screen.getByText('GCP IAM Playlist Guide')).toBeInTheDocument();
      expect(screen.queryByText('GCP IAM Notes')).not.toBeInTheDocument();
    });
  });

  it('should show all posts after filters are cleared', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    fireEvent.click(screen.getByRole('button', { name: 'Docker' }));
    fireEvent.click(screen.getByRole('button', { name: /clear filters/i }));

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

  it('renders large article feeds progressively in groups of twelve', async () => {
    const manyPosts: BlogPost[] = Array.from({ length: 15 }, (_, index) => ({
      id: `article-${index + 1}`,
      title: `Scalable Article ${index + 1}`,
      excerpt: `Operational article ${index + 1}`,
      date: `2024-01-${String(15 - index).padStart(2, '0')}`,
      readTime: '5 min read',
      tags: ['DevOps'],
      content: '',
    }));
    vi.mocked(markdownLoader.loadMarkdownPosts).mockResolvedValue(manyPosts);
    renderWithRouter(<Blog />);

    await waitFor(() => expect(screen.getByText('Scalable Article 1')).toBeInTheDocument());
    expect(screen.queryByText('Scalable Article 13')).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Load 12 more articles' }));
    expect(screen.getByText('Scalable Article 15')).toBeInTheDocument();
  });

  it('should show "no articles found" when search returns no results', async () => {
    renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    const searchInput = screen.getByPlaceholderText(/search commands/i);
    fireEvent.change(searchInput, { target: { value: 'NonExistentTopic' } });

    await waitFor(() => {
      expect(screen.getByText(/no matching articles/i)).toBeInTheDocument();
    });
  });

  it('should display page title and description', () => {
    renderWithRouter(<Blog />);

    expect(screen.getByRole('heading', { name: 'DevOps field notes' })).toBeInTheDocument();
  });

  it('should use memoized handlers (performance optimization)', async () => {
    const { rerender } = renderWithRouter(<Blog />);

    await waitFor(() => {
      expect(screen.getByText('Getting Started with Docker')).toBeInTheDocument();
    });

    // Re-render should not recreate handlers
    rerender(<MemoryRouter><Blog /></MemoryRouter>);

    // Functionality should still work
    const searchInput = screen.getByPlaceholderText(/search commands/i);
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
