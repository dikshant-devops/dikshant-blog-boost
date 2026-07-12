import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Footer } from './Footer';

function renderFooter() {
  return render(
    <MemoryRouter>
      <Footer />
    </MemoryRouter>
  );
}

describe('Footer', () => {
  it('renders the site name', () => {
    renderFooter();
    expect(screen.getByText('Tech With Dikshant')).toBeInTheDocument();
  });

  it('has no dead href="#" links', () => {
    renderFooter();
    const links = document.querySelectorAll('a[href="#"]');
    expect(links.length).toBe(0);
  });

  it('renders quick links pointing to real routes', () => {
    renderFooter();
    const internalLinks = document.querySelectorAll('a[href]');
    const hrefs = Array.from(internalLinks).map(a => a.getAttribute('href'));
    // All links should be real routes or external URLs, not "#"
    hrefs.forEach(href => {
      expect(href).not.toBe('#');
    });
  });

  it('renders external social links with target="_blank"', () => {
    renderFooter();
    const externalLinks = document.querySelectorAll('a[target="_blank"]');
    expect(externalLinks.length).toBeGreaterThanOrEqual(3); // LinkedIn, Twitter, GitHub
    externalLinks.forEach(link => {
      expect(link.getAttribute('rel')).toContain('noopener');
    });
  });

  it('renders copyright with current year', () => {
    renderFooter();
    const year = new Date().getFullYear().toString();
    expect(screen.getByText(new RegExp(year))).toBeInTheDocument();
  });

  it('links to privacy and terms pages', () => {
    renderFooter();
    expect(screen.getByRole('link', { name: 'Privacy' })).toHaveAttribute('href', '/privacy');
    expect(screen.getByRole('link', { name: 'Terms' })).toHaveAttribute('href', '/terms');
  });

  it('uses an editorial multi-column layout on desktop', () => {
    renderFooter();
    const grid = document.querySelector('.grid');
    expect(grid?.className).toContain('md:grid-cols-');
  });
});
