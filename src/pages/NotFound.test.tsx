import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import NotFound from './NotFound';

function renderNotFound() {
  return render(
    <MemoryRouter>
      <NotFound />
    </MemoryRouter>
  );
}

describe('NotFound', () => {
  it('renders 404 heading', () => {
    renderNotFound();
    expect(screen.getByText('404')).toBeInTheDocument();
  });

  it('uses theme-aware text color (not hardcoded gray)', () => {
    renderNotFound();
    const description = screen.getByText('Oops! Page not found');
    expect(description.className).toContain('text-muted-foreground');
    expect(description.className).not.toContain('text-gray-600');
  });

  it('uses React Router Link (not <a> tag)', () => {
    renderNotFound();
    const link = screen.getByText('Return to Home');
    // React Router Link renders as <a> but within the Router context
    expect(link.tagName).toBe('A');
    expect(link).toHaveAttribute('href', '/');
  });

  it('uses theme-aware link color (not hardcoded blue)', () => {
    renderNotFound();
    const link = screen.getByText('Return to Home');
    expect(link.className).toContain('text-primary');
    expect(link.className).not.toContain('text-blue-500');
  });
});
