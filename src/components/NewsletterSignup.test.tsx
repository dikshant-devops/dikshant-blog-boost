import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { NewsletterSignup } from './NewsletterSignup';

// Mock useToast
const mockToast = vi.fn();
vi.mock('@/hooks/use-toast', () => ({
  useToast: () => ({ toast: mockToast }),
}));

describe('NewsletterSignup', () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.stubGlobal('fetch', vi.fn());
  });

  describe('default variant', () => {
    it('renders card with "Stay Updated" title', () => {
      render(<NewsletterSignup />);
      expect(screen.getByText('Stay Updated')).toBeInTheDocument();
    });

    it('renders email input and subscribe button', () => {
      render(<NewsletterSignup />);
      expect(screen.getByPlaceholderText('Enter your email address')).toBeInTheDocument();
      expect(screen.getByText('Subscribe to Newsletter')).toBeInTheDocument();
    });

    it('applies custom className', () => {
      const { container } = render(<NewsletterSignup className="my-custom" />);
      expect(container.querySelector('.my-custom')).toBeTruthy();
    });
  });

  describe('inline variant', () => {
    it('renders inline layout with different title', () => {
      render(<NewsletterSignup variant="inline" />);
      expect(screen.getByText('Subscribe to Our Newsletter')).toBeInTheDocument();
    });

    it('renders inline email input', () => {
      render(<NewsletterSignup variant="inline" />);
      expect(screen.getByPlaceholderText('Enter your email')).toBeInTheDocument();
      expect(screen.getByText('Subscribe')).toBeInTheDocument();
    });
  });

  describe('form submission', () => {
    it('does not submit when email is empty', async () => {
      render(<NewsletterSignup />);
      const form = screen.getByPlaceholderText('Enter your email address').closest('form')!;
      fireEvent.submit(form);

      expect(fetch).not.toHaveBeenCalled();
    });

    it('calls fetch with correct payload on submit', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<NewsletterSignup />);
      const input = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(input, { target: { value: 'user@test.com' } });

      const form = input.closest('form')!;
      fireEvent.submit(form);

      await waitFor(() => {
        expect(fetch).toHaveBeenCalledWith('/newsletter-subscribe', expect.objectContaining({
          method: 'POST',
          body: JSON.stringify({ email: 'user@test.com' }),
        }));
      });
    });

    it('shows success toast on successful subscription', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<NewsletterSignup />);
      const input = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(input, { target: { value: 'user@test.com' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: expect.stringContaining('Welcome'),
        }));
      });
    });

    it('clears email after successful subscription', async () => {
      (fetch as any).mockResolvedValue({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      render(<NewsletterSignup />);
      const input = screen.getByPlaceholderText('Enter your email address') as HTMLInputElement;
      fireEvent.change(input, { target: { value: 'user@test.com' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(input.value).toBe('');
      });
    });

    it('shows error toast on API failure', async () => {
      (fetch as any).mockResolvedValue({
        ok: false,
        status: 500,
        text: () => Promise.resolve('Server Error'),
      });

      render(<NewsletterSignup />);
      const input = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(input, { target: { value: 'user@test.com' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          variant: 'destructive',
        }));
      });
    });

    it('shows network error toast on fetch rejection', async () => {
      (fetch as any).mockRejectedValue(new Error('Network error'));

      render(<NewsletterSignup />);
      const input = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(input, { target: { value: 'user@test.com' } });
      fireEvent.submit(input.closest('form')!);

      await waitFor(() => {
        expect(mockToast).toHaveBeenCalledWith(expect.objectContaining({
          title: 'Network error',
        }));
      });
    });

    it('shows loading state during submission', async () => {
      let resolveRequest: (v: any) => void;
      (fetch as any).mockReturnValue(new Promise(r => { resolveRequest = r; }));

      render(<NewsletterSignup />);
      const input = screen.getByPlaceholderText('Enter your email address');
      fireEvent.change(input, { target: { value: 'user@test.com' } });
      fireEvent.submit(input.closest('form')!);

      expect(screen.getByText('Loading...')).toBeInTheDocument();

      resolveRequest!({
        ok: true,
        json: () => Promise.resolve({ success: true }),
      });

      await waitFor(() => {
        expect(screen.getByText('Subscribe to Newsletter')).toBeInTheDocument();
      });
    });
  });
});
