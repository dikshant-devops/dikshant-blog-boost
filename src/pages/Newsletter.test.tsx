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
    expect(screen.getByText('What arrives')).toBeInTheDocument();
    expect(screen.getByText('New implementation guides')).toBeInTheDocument();
    expect(screen.getByText('Operational lessons')).toBeInTheDocument();
    expect(screen.getByText('Tool and platform updates')).toBeInTheDocument();
  });

  it('does not render fabricated subscriber stats', () => {
    render(<Newsletter />);
    expect(screen.queryByText('500+')).not.toBeInTheDocument();
  });

  it('renders a clear privacy statement instead of an anonymous testimonial', () => {
    render(<Newsletter />);
    expect(screen.getByText(/used only for this newsletter/i)).toBeInTheDocument();
  });
});
