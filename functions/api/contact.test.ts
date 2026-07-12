import { beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequestOptions, onRequestPost } from './contact';

const VALID_BODY = {
  name: 'Dikshant Rai',
  email: 'reader@example.com',
  subject: 'Architecture review',
  message: 'Please review this production architecture.',
  turnstileToken: 'valid-token',
};

function request(body: unknown = VALID_BODY, options: { origin?: string; rawBody?: string; contentLength?: number } = {}) {
  const headers = new Headers({
    Origin: options.origin ?? 'https://techwithdikshant.com',
    'Content-Type': 'application/json',
    'CF-Connecting-IP': '203.0.113.20',
    'User-Agent': 'Vitest',
  });
  if (options.contentLength) headers.set('Content-Length', String(options.contentLength));
  return new Request('https://techwithdikshant.com/api/contact', {
    method: 'POST',
    headers,
    body: options.rawBody ?? JSON.stringify(body),
  });
}

function context(body: unknown = VALID_BODY, env = {}, options = {}) {
  return {
    request: request(body, options),
    env: {
      SHEETDB_API_URL: 'https://sheetdb.example/api/v1/contact',
      TURNSTILE_SECRET_KEY: 'test-secret',
      TURNSTILE_ALLOWED_HOSTNAMES: 'techwithdikshant.com',
      CONTACT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
      ...env,
    },
  };
}

function services(turnstile = {}, sheetStatus = 201) {
  return vi.fn(async (url) => {
    if (String(url).includes('/siteverify')) {
      return new Response(JSON.stringify({
        success: true,
        hostname: 'techwithdikshant.com',
        action: 'contact_submit',
        ...turnstile,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(null, { status: sheetStatus });
  });
}

async function body(response: Response) {
  return response.json() as Promise<{ success: boolean; error?: string }>;
}

describe('contact function', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', services());
  });

  it('returns a CORS preflight response', async () => {
    const response = await onRequestOptions({ request: request() });
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://techwithdikshant.com');
  });

  it('rejects untrusted origins before external calls', async () => {
    const response = await onRequestPost(context(VALID_BODY, {}, { origin: 'https://attacker.example' }));
    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('allows the active loopback preview origin', async () => {
    const response = await onRequestPost(context(
      { ...VALID_BODY, turnstileToken: '' },
      {},
      { origin: 'http://127.0.0.1:4174' },
    ));

    expect(response.status).toBe(400);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:4174');
    expect((await response.json()).error).toContain('Security verification is required');
  });

  it.each([
    [{}, 'Validation error'],
    [{ ...VALID_BODY, email: 'invalid' }, 'Invalid email address'],
    [{ ...VALID_BODY, message: 'short' }, 'Message must be at least 10 characters'],
    [{ ...VALID_BODY, turnstileToken: '' }, 'Security verification is required'],
  ])('validates submitted fields %#', async (submitted, expected) => {
    const response = await onRequestPost(context(submitted));
    expect(response.status).toBe(400);
    expect((await body(response)).error).toContain(expected);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects malformed JSON and oversized requests', async () => {
    const malformed = await onRequestPost(context(null, {}, { rawBody: '{broken' }));
    const oversized = await onRequestPost(context(VALID_BODY, {}, { contentLength: 9000 }));
    expect(malformed.status).toBe(400);
    expect(oversized.status).toBe(413);
  });

  it('fails closed when a required binding is absent', async () => {
    const response = await onRequestPost(context(VALID_BODY, { CONTACT_RATE_LIMITER: undefined }));
    expect(response.status).toBe(500);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rate limits before calling external services', async () => {
    const response = await onRequestPost(context(VALID_BODY, {
      CONTACT_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: false }) },
    }));
    expect(response.status).toBe(429);
    expect(response.headers.get('Retry-After')).toBe('60');
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    { success: false },
    { hostname: 'attacker.example' },
    { action: 'newsletter_subscribe' },
  ])('rejects invalid Turnstile result %#', async (turnstile) => {
    vi.stubGlobal('fetch', services(turnstile));
    const response = await onRequestPost(context());
    expect(response.status).toBe(400);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('forwards normalized validated data after verification', async () => {
    const serviceFetch = services();
    vi.stubGlobal('fetch', serviceFetch);
    const response = await onRequestPost(context({ ...VALID_BODY, email: ' Reader@Example.COM ' }));
    expect(response.status).toBe(200);

    const sheetCall = serviceFetch.mock.calls.find(([url]) => String(url).includes('sheetdb.example'));
    const payload = JSON.parse(sheetCall?.[1]?.body as string);
    expect(payload.data).toMatchObject({
      Name: 'Dikshant Rai',
      Email: 'reader@example.com',
      Subject: 'Architecture review',
      'IP Address': '203.0.113.20',
      'User Agent': 'Vitest',
    });
  });

  it('returns a controlled upstream error without exposing SheetDB details', async () => {
    vi.stubGlobal('fetch', services({}, 500));
    const response = await onRequestPost(context());
    expect(response.status).toBe(502);
    expect((await body(response)).error).toContain('Failed to save');
  });
});
