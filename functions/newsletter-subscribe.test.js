import { beforeEach, describe, expect, it, vi } from 'vitest';

import { onRequestOptions, onRequestPost } from './newsletter-subscribe.js';

const VALID_BODY = {
  email: 'reader@example.com',
  turnstileToken: 'valid-turnstile-token',
};

function createRequest(body = VALID_BODY, options = {}) {
  const rawBody = options.rawBody ?? JSON.stringify(body);
  const headers = new Headers({
    'Content-Type': 'application/json',
    Origin: options.origin ?? 'https://techwithdikshant.com',
    'CF-Connecting-IP': options.ip ?? '203.0.113.10',
  });
  if (options.contentLength) headers.set('Content-Length', String(options.contentLength));

  return new Request('https://techwithdikshant.com/newsletter-subscribe', {
    method: 'POST',
    headers,
    body: rawBody,
  });
}

function createContext(body = VALID_BODY, env = {}, options = {}) {
  return {
    request: createRequest(body, options),
    env: {
      BEEHIIV_API_KEY: 'test-api-key',
      BEEHIIV_PUBLICATION_ID: 'test-pub-id',
      TURNSTILE_SECRET_KEY: 'test-turnstile-secret',
      TURNSTILE_ALLOWED_HOSTNAMES: 'techwithdikshant.com',
      NEWSLETTER_RATE_LIMITER: { limit: vi.fn().mockResolvedValue({ success: true }) },
      ...env,
    },
  };
}

function mockServices({ beehiivStatus = 201, turnstile = {} } = {}) {
  return vi.fn(async (url) => {
    if (String(url).includes('/siteverify')) {
      return new Response(JSON.stringify({
        success: true,
        hostname: 'techwithdikshant.com',
        action: 'newsletter_subscribe',
        ...turnstile,
      }), { status: 200, headers: { 'Content-Type': 'application/json' } });
    }
    return new Response(beehiivStatus === 500 ? JSON.stringify({ message: 'Internal error' }) : null, {
      status: beehiivStatus,
      headers: { 'Content-Type': 'application/json' },
    });
  });
}

async function responseBody(response) {
  return JSON.parse(await response.text());
}

describe('newsletter-subscribe', () => {
  beforeEach(() => {
    vi.restoreAllMocks();
    vi.stubGlobal('fetch', mockServices());
  });

  it('returns the expected CORS preflight response', async () => {
    const response = await onRequestOptions(createContext().request ? createContext() : null);
    expect(response.status).toBe(204);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('https://techwithdikshant.com');
    expect(response.headers.get('Access-Control-Allow-Methods')).toBe('POST, OPTIONS');
  });

  it('rejects an untrusted browser origin before external calls', async () => {
    const response = await onRequestPost(createContext(VALID_BODY, {}, { origin: 'https://attacker.example' }));
    expect(response.status).toBe(403);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('allows the active loopback preview origin', async () => {
    const response = await onRequestPost(createContext(
      { email: 'reader@example.com' },
      {},
      { origin: 'http://127.0.0.1:4174' },
    ));

    expect(response.status).toBe(400);
    expect(response.headers.get('Access-Control-Allow-Origin')).toBe('http://127.0.0.1:4174');
    expect(await response.json()).toEqual({ success: false, error: 'Security verification is required' });
  });

  it('rejects a declared oversized body', async () => {
    const response = await onRequestPost(createContext(VALID_BODY, {}, { contentLength: 5000 }));
    expect(response.status).toBe(413);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('rejects an oversized body when content-length is absent', async () => {
    const response = await onRequestPost(createContext(null, {}, { rawBody: JSON.stringify({ padding: 'x'.repeat(5000) }) }));
    expect(response.status).toBe(413);
  });

  it('rejects malformed JSON with a client error', async () => {
    const response = await onRequestPost(createContext(null, {}, { rawBody: '{broken' }));
    expect(response.status).toBe(400);
    expect((await responseBody(response)).error).toContain('Invalid JSON');
  });

  it.each([
    [{ turnstileToken: 'token' }, 'Email is required'],
    [{ email: 'not-an-email', turnstileToken: 'token' }, 'Invalid email format'],
    [{ email: 'a'.repeat(250) + '@example.com', turnstileToken: 'token' }, 'Invalid email format'],
    [{ email: 'reader@example.com' }, 'Security verification is required'],
    [{ email: 'reader@example.com', turnstileToken: 'x'.repeat(2049) }, 'Security verification is required'],
  ])('rejects invalid input %#', async (body, message) => {
    const response = await onRequestPost(createContext(body));
    expect(response.status).toBe(400);
    expect((await responseBody(response)).error).toBe(message);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('fails closed when the rate limiter binding is missing', async () => {
    const response = await onRequestPost(createContext(VALID_BODY, { NEWSLETTER_RATE_LIMITER: undefined }));
    expect(response.status).toBe(500);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('returns 429 before verification when the rate limit is exceeded', async () => {
    const limiter = { limit: vi.fn().mockResolvedValue({ success: false }) };
    const response = await onRequestPost(createContext(VALID_BODY, { NEWSLETTER_RATE_LIMITER: limiter }));
    expect(response.status).toBe(429);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    [{ success: false }, 'unsuccessful token'],
    [{ action: 'contact' }, 'wrong action'],
    [{ hostname: 'attacker.example' }, 'wrong hostname'],
  ])('rejects Turnstile validation with $1', async (turnstile) => {
    vi.stubGlobal('fetch', mockServices({ turnstile }));
    const response = await onRequestPost(createContext());
    expect(response.status).toBe(400);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it('fails verification when the Turnstile secret is missing', async () => {
    const response = await onRequestPost(createContext(VALID_BODY, { TURNSTILE_SECRET_KEY: '' }));
    expect(response.status).toBe(400);
    expect(fetch).not.toHaveBeenCalled();
  });

  it('validates configuration before calling Beehiiv', async () => {
    const response = await onRequestPost(createContext(VALID_BODY, { BEEHIIV_API_KEY: '' }));
    expect(response.status).toBe(500);
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it.each([
    [201, 200, 'Successfully subscribed'],
    [409, 200, 'already subscribed'],
    [401, 500, 'authentication'],
    [429, 429, 'Too many requests'],
    [500, 500, 'Internal error'],
  ])('maps Beehiiv status %i to a controlled response', async (beehiivStatus, expectedStatus, message) => {
    vi.stubGlobal('fetch', mockServices({ beehiivStatus }));
    const response = await onRequestPost(createContext());
    expect(response.status).toBe(expectedStatus);
    expect(JSON.stringify(await responseBody(response))).toContain(message);
  });

  it('normalizes email and sends the existing Beehiiv subscription options', async () => {
    const serviceFetch = mockServices();
    vi.stubGlobal('fetch', serviceFetch);
    await onRequestPost(createContext({ ...VALID_BODY, email: ' Reader@Example.COM ' }));

    const beehiivCall = serviceFetch.mock.calls.find(([url]) => String(url).includes('api.beehiiv.com'));
    expect(beehiivCall).toBeTruthy();
    const payload = JSON.parse(beehiivCall[1].body);
    expect(payload).toMatchObject({
      email: 'reader@example.com',
      reactivate_existing: false,
      send_welcome_email: true,
      utm_source: 'website',
    });
  });
});
