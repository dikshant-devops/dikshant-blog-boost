import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import Newsletter from './Newsletter';

// Mock NewsletterSignup component
vi.mock('@/components/NewsletterSignup', () => ({
  NewsletterSignup: ({ className }: { className?: string }) => (
    <div data-testid="newsletter-signup" className={className}>MockNewsletterSignup</div>
  ),
}));

describe('Newsletter Page', () => {
  it('renders page heading', () => {
    render(<Newsletter />);
    expect(screen.getByText('Newsletter')).toBeInTheDocument();
  });

  it('renders newsletter signup component', () => {
    render(<Newsletter />);
    expect(screen.getByTestId('newsletter-signup')).toBeInTheDocument();
  });

  it('renders benefits section', () => {
    render(<Newsletter />);
    expect(screen.getByText("What You'll Get")).toBeInTheDocument();
    expect(screen.getByText('Weekly DevOps Tips')).toBeInTheDocument();
    expect(screen.getByText('Exclusive Tutorials')).toBeInTheDocument();
    expect(screen.getByText('Industry Updates')).toBeInTheDocument();
    expect(screen.getByText('Early Access')).toBeInTheDocument();
  });

  it('renders subscriber stats', () => {
    render(<Newsletter />);
    expect(screen.getByText('Weekly')).toBeInTheDocument();
    expect(screen.getByText('500+')).toBeInTheDocument();
  });

  it('renders testimonial section', () => {
    render(<Newsletter />);
    expect(screen.getByText(/Tech With Dikshant's newsletter/)).toBeInTheDocument();
  });
});
