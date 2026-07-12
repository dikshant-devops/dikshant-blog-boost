import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Connect from './Connect';

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('Connect Page', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
    // Mock import.meta.env for Turnstile
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', '');
    window.turnstile = undefined;
  });

  it('renders page heading', () => {
    render(<Connect />);
    expect(screen.getByRole('heading', { name: 'Start a useful conversation' })).toBeInTheDocument();
  });

  it('renders all form fields', () => {
    render(<Connect />);
    expect(screen.getByLabelText('Name')).toBeInTheDocument();
    expect(screen.getByLabelText('Email')).toBeInTheDocument();
    expect(screen.getByLabelText('Subject')).toBeInTheDocument();
    expect(screen.getByLabelText('Message')).toBeInTheDocument();
  });

  it('renders social links section', () => {
    render(<Connect />);
    expect(screen.getByText('Find me elsewhere')).toBeInTheDocument();
    expect(screen.getAllByText('LinkedIn').length).toBeGreaterThan(0);
    expect(screen.getAllByText('Twitter').length).toBeGreaterThan(0);
    expect(screen.getAllByText('GitHub').length).toBeGreaterThan(0);
  });

  it('renders send button', () => {
    render(<Connect />);
    expect(screen.getByText('Send message')).toBeInTheDocument();
  });

  describe('form input handling', () => {
    it('updates name field on change', () => {
      render(<Connect />);
      const input = screen.getByLabelText('Name') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'John', name: 'name' } });
      expect(input.value).toBe('John');
    });

    it('updates email field on change', () => {
      render(<Connect />);
      const input = screen.getByLabelText('Email') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'john@test.com', name: 'email' } });
      expect(input.value).toBe('john@test.com');
    });
  });

  describe('form validation', () => {
    it('shows missing fields toast when submitting empty form', async () => {
      render(<Connect />);
      fireEvent.submit(screen.getByText('Send message').closest('form')!);

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Missing fields',
        variant: 'destructive',
      }));
    });

    it('shows verification required when Turnstile token is missing', async () => {
      render(<Connect />);

      // Fill all fields
      fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John', name: 'name' } });
      fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com', name: 'email' } });
      fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Test', name: 'subject' } });
      fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Hello', name: 'message' } });

      fireEvent.submit(screen.getByText('Send message').closest('form')!);

      expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
        title: 'Verification required',
        variant: 'destructive',
      }));
    });
  });

  it('preserves the contact API endpoint and Turnstile payload', async () => {
    vi.stubEnv('VITE_TURNSTILE_SITE_KEY', 'test-site-key');
    window.turnstile = {
      reset: vi.fn(),
      render: vi.fn((_element, options) => {
        options.callback('verified-token');
        return 'widget-id';
      }),
    };
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
      json: () => Promise.resolve({ success: true }),
    } as Response);

    render(<Connect />);
    fireEvent.change(screen.getByLabelText('Name'), { target: { value: 'John', name: 'name' } });
    fireEvent.change(screen.getByLabelText('Email'), { target: { value: 'john@test.com', name: 'email' } });
    fireEvent.change(screen.getByLabelText('Subject'), { target: { value: 'Architecture', name: 'subject' } });
    fireEvent.change(screen.getByLabelText('Message'), { target: { value: 'Please review this system.', name: 'message' } });

    await waitFor(() => expect(window.turnstile?.render).toHaveBeenCalled());
    fireEvent.submit(screen.getByText('Send message').closest('form')!);

    await waitFor(() => {
      expect(fetch).toHaveBeenCalledWith('/api/contact', expect.objectContaining({
        method: 'POST',
        body: JSON.stringify({
          name: 'John',
          email: 'john@test.com',
          subject: 'Architecture',
          message: 'Please review this system.',
          turnstileToken: 'verified-token',
        }),
      }));
    });
  });

  describe('social links', () => {
    it('LinkedIn link opens in new tab', () => {
      render(<Connect />);
      // Find the LinkedIn heading inside the social cards section
      const linkedinHeadings = screen.getAllByText('LinkedIn');
      const linkedinLink = linkedinHeadings.find(el => el.closest('a'))?.closest('a');
      expect(linkedinLink?.getAttribute('target')).toBe('_blank');
      expect(linkedinLink?.getAttribute('rel')).toContain('noopener');
    });

    it('has a mailto link for email contact', () => {
      render(<Connect />);
      const allLinks = document.querySelectorAll('a[href^="mailto:"]');
      expect(allLinks.length).toBeGreaterThan(0);
    });

    it('Email social link does not open in new tab', () => {
      render(<Connect />);
      const mailtoLink = document.querySelector('a[href^="mailto:"]');
      expect(mailtoLink?.getAttribute('target')).toBeNull();
    });
  });

  it('renders guidance for a useful and safe inquiry', () => {
    render(<Connect />);
    expect(screen.getByText('For the best response')).toBeInTheDocument();
    expect(screen.getByText(/Never send credentials/)).toBeInTheDocument();
  });
});
