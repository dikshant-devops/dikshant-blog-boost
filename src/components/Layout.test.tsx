import { describe, it, expect, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { Layout } from './Layout';

// Mock Header and Footer to keep test focused
vi.mock('./Header', () => ({
  Header: () => <header data-testid="header">Header</header>,
}));
vi.mock('./Footer', () => ({
  Footer: () => <footer data-testid="footer">Footer</footer>,
}));

describe('Layout', () => {
  it('renders header', () => {
    render(<BrowserRouter><Layout><div>Content</div></Layout></BrowserRouter>);
    expect(screen.getByTestId('header')).toBeInTheDocument();
  });

  it('renders footer', () => {
    render(<BrowserRouter><Layout><div>Content</div></Layout></BrowserRouter>);
    expect(screen.getByTestId('footer')).toBeInTheDocument();
  });

  it('renders children content', () => {
    render(<BrowserRouter><Layout><div>Test Child Content</div></Layout></BrowserRouter>);
    expect(screen.getByText('Test Child Content')).toBeInTheDocument();
  });

  it('has min-h-screen on wrapper', () => {
    const { container } = render(<BrowserRouter><Layout><div>C</div></Layout></BrowserRouter>);
    expect(container.firstChild).toHaveClass('min-h-screen');
  });

  it('children are inside main element', () => {
    render(<BrowserRouter><Layout><div>Main Content</div></Layout></BrowserRouter>);
    const main = document.querySelector('main');
    expect(main).toBeTruthy();
    expect(main?.textContent).toContain('Main Content');
  });
});
