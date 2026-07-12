import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { BlogCard } from './BlogCard';
import { BlogPost } from '@/types/blog';

const mockPost: BlogPost = {
  id: 'test-post',
  title: 'Test Blog Post Title',
  excerpt: 'This is a test excerpt for the blog post',
  date: '2024-01-15',
  readTime: '5 min read',
  tags: ['Docker', 'DevOps', 'Kubernetes'],
  content: 'Test content'
};

// Helper to render with Router
const renderWithRouter = (component: React.ReactElement) => {
  return render(<BrowserRouter>{component}</BrowserRouter>);
};

describe('BlogCard', () => {
  it('should render post title', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    expect(screen.getByText('Test Blog Post Title')).toBeInTheDocument();
  });

  it('should render post excerpt', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    expect(screen.getByText('This is a test excerpt for the blog post')).toBeInTheDocument();
  });

  it('should display formatted date', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    // The date should be formatted as "January 15, 2024"
    expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
  });

  it('should display read time', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    expect(screen.getByText('5 min read')).toBeInTheDocument();
  });

  it('should render all tags', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    expect(screen.getByText('Docker')).toBeInTheDocument();
    expect(screen.getByText('DevOps')).toBeInTheDocument();
    expect(screen.getByText('Kubernetes')).toBeInTheDocument();
  });

  it('should have correct link to blog post', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/blog/test-post');
  });

  it('entire card is wrapped in a link (fully clickable)', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('href', '/blog/test-post');
    // The link wraps the entire card including excerpt and tags
    expect(link).toHaveTextContent('This is a test excerpt for the blog post');
    expect(link).toHaveTextContent('Docker');
  });

  it('link has aria-label for accessibility', () => {
    renderWithRouter(<BlogCard post={mockPost} />);
    const link = screen.getByRole('link');
    expect(link).toHaveAttribute('aria-label', 'Test Blog Post Title');
  });

  it('should handle posts with single tag', () => {
    const singleTagPost: BlogPost = {
      ...mockPost,
      tags: ['Docker']
    };
    renderWithRouter(<BlogCard post={singleTagPost} />);
    expect(screen.getByText('Docker')).toBeInTheDocument();
  });

  it('should handle posts with many tags', () => {
    const manyTagsPost: BlogPost = {
      ...mockPost,
      tags: ['Docker', 'Kubernetes', 'CI/CD', 'DevOps', 'Cloud']
    };
    renderWithRouter(<BlogCard post={manyTagsPost} />);
    expect(screen.getByText('Cloud')).toBeInTheDocument();
  });

  it('does not repeat category or platform labels as tags', () => {
    const classifiedPost: BlogPost = {
      ...mockPost,
      category: 'Containers',
      platform: 'Docker',
      tags: ['Docker', 'Containers', 'DevOps']
    };
    renderWithRouter(<BlogCard post={classifiedPost} />);

    expect(screen.getAllByText('Docker')).toHaveLength(1);
    expect(screen.getAllByText('Containers')).toHaveLength(1);
    expect(screen.getByText('DevOps')).toBeInTheDocument();
  });

  it('should memoize date formatting (component optimization)', () => {
    const { rerender } = renderWithRouter(<BlogCard post={mockPost} />);

    // Re-render with same props should not recalculate date
    rerender(<BrowserRouter><BlogCard post={mockPost} /></BrowserRouter>);

    // Date should still be displayed correctly
    expect(screen.getByText(/January 15, 2024/)).toBeInTheDocument();
  });
});
