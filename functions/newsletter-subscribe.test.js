import { describe, it, expect, vi, beforeEach } from 'vitest';
import { onRequestPost, onRequestOptions } from './newsletter-subscribe.js';

// Helper to create a mock request
function mockRequest(body, origin = 'https://techwithdikshant.com') {
  return {
    json: () => Promise.resolve(body),
    headers: {
      get: (name) => {
        if (name === 'Origin') return origin;
        return null;
      },
    },
  };
}

// Helper to create context
function mockContext(body, env = {}, origin = 'https://techwithdikshant.com') {
  return {
    request: mockRequest(body, origin),
    env: {
      BEEHIIV_API_KEY: 'test-api-key',
      BEEHIIV_PUBLICATION_ID: 'test-pub-id',
      ...env,
    },
  };
}

// Helper to parse response body
async function parseResponse(response) {
  const text = await response.text();
  return JSON.parse(text);
}

describe('newsletter-subscribe', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
  });

  describe('onRequestOptions (CORS preflight)', () => {
    it('returns 204 with CORS headers', async () => {
      const context = mockContext({});
      const response = await onRequestOptions(context);

      expect(response.status).toBe(204);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://techwithdikshant.com');
      expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
      expect(response.headers.get('Access-Control-Max-Age')).toBe('86400');
    });
  });

  describe('CORS origin validation', () => {
    it('allows techwithdikshant.com origin', async () => {
      const context = mockContext({ email: 'test@example.com' }, {}, 'https://techwithdikshant.com');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 201 }));

      const response = await onRequestPost(context);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://techwithdikshant.com');
    });

    it('allows localhost:8080 origin', async () => {
      const context = mockContext({ email: 'test@example.com' }, {}, 'http://localhost:8080');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 201 }));

      const response = await onRequestPost(context);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://localhost:8080');
    });

    it('falls back to production origin for unknown origins', async () => {
      const context = mockContext({ email: 'test@example.com' }, {}, 'https://evil.com');
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 201 }));

      const response = await onRequestPost(context);
      expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://techwithdikshant.com');
    });
  });

  describe('email validation', () => {
    it('rejects missing email', async () => {
      const context = mockContext({});
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.success).toBe(false);
      expect(body.error).toBe('Email is required');
    });

    it('rejects empty email', async () => {
      const context = mockContext({ email: '' });
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe('Email is required');
    });

    it('rejects invalid email format', async () => {
      const context = mockContext({ email: 'not-an-email' });
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid email format');
    });

    it('rejects email without domain', async () => {
      const context = mockContext({ email: 'user@' });
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(400);
      expect(body.error).toBe('Invalid email format');
    });

    it('accepts valid email', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 201 }));
      const context = mockContext({ email: 'valid@example.com' });
      const response = await onRequestPost(context);

      expect(response.status).toBe(200);
    });
  });

  describe('environment validation', () => {
    it('returns 500 when BEEHIIV_API_KEY is missing', async () => {
      const context = mockContext(
        { email: 'test@example.com' },
        { BEEHIIV_API_KEY: '', BEEHIIV_PUBLICATION_ID: 'pub-id' }
      );
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe('Server configuration error');
    });

    it('returns 500 when BEEHIIV_PUBLICATION_ID is missing', async () => {
      const context = mockContext(
        { email: 'test@example.com' },
        { BEEHIIV_API_KEY: 'key', BEEHIIV_PUBLICATION_ID: '' }
      );
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe('Server configuration error');
    });
  });

  describe('Beehiiv API responses', () => {
    it('handles 201 (new subscription)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 201 }));

      const context = mockContext({ email: 'new@example.com' });
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain('Successfully subscribed');
    });

    it('handles 409 (already subscribed)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 409 }));

      const context = mockContext({ email: 'existing@example.com' });
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(200);
      expect(body.success).toBe(true);
      expect(body.message).toContain('already subscribed');
    });

    it('handles 401 (unauthorized)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 401 }));

      const context = mockContext({ email: 'test@example.com' });
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe('Server authentication error');
    });

    it('handles 429 (rate limited)', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ status: 429 }));

      const context = mockContext({ email: 'test@example.com' });
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(429);
      expect(body.error).toContain('Too many requests');
    });

    it('handles unknown error status with error body', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 500,
        json: () => Promise.resolve({ message: 'Internal error' }),
      }));

      const context = mockContext({ email: 'test@example.com' });
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toBe('Internal error');
    });

    it('handles unknown error status with unparseable body', async () => {
      vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
        status: 502,
        json: () => Promise.reject(new Error('not json')),
      }));

      const context = mockContext({ email: 'test@example.com' });
      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(502);
      expect(body.error).toContain('Failed to subscribe');
    });
  });

  describe('unexpected errors', () => {
    it('handles request.json() failure', async () => {
      const context = {
        request: {
          json: () => Promise.reject(new Error('Invalid JSON')),
          headers: { get: () => 'https://techwithdikshant.com' },
        },
        env: { BEEHIIV_API_KEY: 'key', BEEHIIV_PUBLICATION_ID: 'pub' },
      };

      const response = await onRequestPost(context);
      const body = await parseResponse(response);

      expect(response.status).toBe(500);
      expect(body.error).toContain('unexpected error');
    });
  });

  describe('Beehiiv API request format', () => {
    it('sends correct payload to Beehiiv', async () => {
      const mockFetch = vi.fn().mockResolvedValue({ status: 201 });
      vi.stubGlobal('fetch', mockFetch);

      const context = mockContext({ email: 'test@example.com' });
      await onRequestPost(context);

      expect(mockFetch).toHaveBeenCalledWith(
        'https://api.beehiiv.com/v2/publications/test-pub-id/subscriptions',
        expect.objectContaining({
          method: 'POST',
          headers: expect.objectContaining({
            'Authorization': 'Bearer test-api-key',
            'Content-Type': 'application/json',
          }),
        })
      );

      const sentBody = JSON.parse(mockFetch.mock.calls[0][1].body);
      expect(sentBody.email).toBe('test@example.com');
      expect(sentBody.send_welcome_email).toBe(true);
      expect(sentBody.utm_source).toBe('website');
    });
  });
});
