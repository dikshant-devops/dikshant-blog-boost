import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Header } from './Header';

// Mock next-themes
vi.mock('next-themes', () => ({
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn() }),
}));

function renderHeader(route = '/') {
  return render(
    <MemoryRouter initialEntries={[route]}>
      <Header />
    </MemoryRouter>
  );
}

describe('Header', () => {
  it('renders the site title', () => {
    renderHeader();
    expect(screen.getByText('Tech With Dikshant')).toBeInTheDocument();
  });

  it('renders desktop navigation links', () => {
    renderHeader();
    expect(screen.getAllByText('Home').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Blog').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('About').length).toBeGreaterThanOrEqual(1);
    expect(screen.getAllByText('Connect').length).toBeGreaterThanOrEqual(1);
  });

  it('renders the mobile hamburger button', () => {
    renderHeader();
    const menuButton = screen.getByLabelText('Open menu');
    expect(menuButton).toBeInTheDocument();
  });

  it('renders theme toggle button', () => {
    renderHeader();
    expect(screen.getByText('Toggle theme')).toBeInTheDocument();
  });

  it('highlights active nav link for current route', () => {
    renderHeader('/blog');
    const blogLinks = screen.getAllByText('Blog');
    // At least one Blog link should have the active class
    const hasActive = blogLinks.some(
      (el) => el.className.includes('text-primary') && !el.className.includes('text-muted-foreground')
    );
    expect(hasActive).toBe(true);
  });
});
