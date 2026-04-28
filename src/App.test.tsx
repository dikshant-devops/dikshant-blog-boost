import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';
import App from './App';

// Mock all lazy-loaded pages
vi.mock('./pages/Index', () => ({ default: () => <div>Home Page</div> }));
vi.mock('./pages/Blog', () => ({ default: () => <div>Blog Page</div> }));
vi.mock('./pages/BlogPost', () => ({ default: () => <div>Blog Post Page</div> }));
vi.mock('./pages/Newsletter', () => ({ default: () => <div>Newsletter Page</div> }));
vi.mock('./pages/About', () => ({ default: () => <div>About Page</div> }));
vi.mock('./pages/Connect', () => ({ default: () => <div>Connect Page</div> }));
vi.mock('./pages/Admin', () => ({ default: () => <div>Admin Page</div> }));
vi.mock('./pages/NotFound', () => ({ default: () => <div>Not Found Page</div> }));

// Mock layout to simplify
vi.mock('@/components/Layout', () => ({
  Layout: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
}));

// Mock next-themes with useTheme (used by sonner component)
vi.mock('next-themes', () => ({
  ThemeProvider: ({ children }: { children: React.ReactNode }) => <div>{children}</div>,
  useTheme: () => ({ theme: 'dark', setTheme: vi.fn(), resolvedTheme: 'dark' }),
}));

describe('App', () => {
  beforeEach(() => {
    window.history.pushState({}, '', '/');
  });

  it('renders without crashing', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  it('renders home page at root route', async () => {
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Home Page')).toBeInTheDocument();
    });
  });

  it('renders blog page at /blog route', async () => {
    window.history.pushState({}, '', '/blog');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Blog Page')).toBeInTheDocument();
    });
  });

  it('renders about page at /about route', async () => {
    window.history.pushState({}, '', '/about');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('About Page')).toBeInTheDocument();
    });
  });

  it('renders newsletter page at /newsletter route', async () => {
    window.history.pushState({}, '', '/newsletter');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Newsletter Page')).toBeInTheDocument();
    });
  });

  it('renders connect page at /connect route', async () => {
    window.history.pushState({}, '', '/connect');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Connect Page')).toBeInTheDocument();
    });
  });

  it('renders admin page at /admin route', async () => {
    window.history.pushState({}, '', '/admin');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Admin Page')).toBeInTheDocument();
    });
  });

  it('renders NotFound for unknown routes', async () => {
    window.history.pushState({}, '', '/some-random-path');
    render(<App />);
    await waitFor(() => {
      expect(screen.getByText('Not Found Page')).toBeInTheDocument();
    });
  });
});
