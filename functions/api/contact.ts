import { z } from 'zod';

interface RateLimiter {
  limit: (options: { key: string }) => Promise<{ success: boolean }>;
}

interface Env {
  SHEETDB_API_URL: string;
  TURNSTILE_SECRET_KEY: string;
  TURNSTILE_ALLOWED_HOSTNAMES?: string;
  CONTACT_RATE_LIMITER?: RateLimiter;
}

const MAX_BODY_BYTES = 8_192;
const TURNSTILE_ACTION = 'contact_submit';
const PRODUCTION_ORIGINS = ['https://techwithdikshant.com'];
const LOCAL_ORIGIN_PATTERN = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/;

const ContactSchema = z.object({
  name: z.string().trim().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().trim().toLowerCase().email('Invalid email address').max(254, 'Email is too long'),
  subject: z.string().trim().min(3, 'Subject must be at least 3 characters').max(200, 'Subject is too long'),
  message: z.string().trim().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
  turnstileToken: z.string().min(1, 'Security verification is required').max(2048, 'Invalid security verification'),
});

function corsHeaders(origin?: string | null) {
  return {
    'Access-Control-Allow-Origin': origin && isAllowedOriginValue(origin) ? origin : PRODUCTION_ORIGINS[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

function jsonResponse(request: Request, status: number, payload: Record<string, unknown>, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: { 'Content-Type': 'application/json', ...corsHeaders(request.headers.get('Origin')), ...extraHeaders },
  });
}

function isAllowedOriginValue(origin: string) {
  return PRODUCTION_ORIGINS.includes(origin) || LOCAL_ORIGIN_PATTERN.test(origin);
}

function isAllowedOrigin(request: Request) {
  const origin = request.headers.get('Origin');
  return !origin || isAllowedOriginValue(origin);
}

async function verifyTurnstile(token: string, env: Env, ip?: string): Promise<boolean> {
  if (!env.TURNSTILE_SECRET_KEY) return false;

  try {
    const formData = new FormData();
    formData.append('secret', env.TURNSTILE_SECRET_KEY);
    formData.append('response', token);
    if (ip) formData.append('remoteip', ip);

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });
    if (!response.ok) return false;

    const result = await response.json() as { success?: boolean; action?: string; hostname?: string };
    const allowedHostnames = (env.TURNSTILE_ALLOWED_HOSTNAMES || 'techwithdikshant.com,www.techwithdikshant.com')
      .split(',')
      .map((hostname) => hostname.trim())
      .filter(Boolean);

    return result.success === true &&
      result.action === TURNSTILE_ACTION &&
      typeof result.hostname === 'string' &&
      allowedHostnames.includes(result.hostname);
  } catch (error) {
    console.error('[Contact] Turnstile verification failed:', error);
    return false;
  }
}

export async function onRequestOptions(context: { request: Request }): Promise<Response> {
  return new Response(null, { status: 204, headers: corsHeaders(context.request.headers.get('Origin')) });
}

export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;

  try {
    if (!isAllowedOrigin(request)) {
      return jsonResponse(request, 403, { success: false, error: 'Request origin is not allowed' });
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return jsonResponse(request, 413, { success: false, error: 'Request body is too large' });
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return jsonResponse(request, 413, { success: false, error: 'Request body is too large' });
    }

    let body: unknown;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return jsonResponse(request, 400, { success: false, error: 'Invalid JSON in request body' });
    }

    const validation = ContactSchema.safeParse(body);
    if (!validation.success) {
      const errors = validation.error.issues.map((issue) => issue.message).join(', ');
      return jsonResponse(request, 400, { success: false, error: `Validation error: ${errors}` });
    }

    if (!env.CONTACT_RATE_LIMITER?.limit || !env.SHEETDB_API_URL || !env.TURNSTILE_SECRET_KEY) {
      console.error('[Contact] Missing required server configuration');
      return jsonResponse(request, 500, { success: false, error: 'Server configuration error' });
    }

    const ip = request.headers.get('CF-Connecting-IP') || 'unknown';
    const rateLimit = await env.CONTACT_RATE_LIMITER.limit({ key: ip });
    if (!rateLimit.success) {
      return jsonResponse(
        request,
        429,
        { success: false, error: 'Too many requests. Please try again later.' },
        { 'Retry-After': '60' },
      );
    }

    const data = validation.data;
    if (!await verifyTurnstile(data.turnstileToken, env, ip === 'unknown' ? undefined : ip)) {
      return jsonResponse(request, 400, { success: false, error: 'Security verification failed. Please try again.' });
    }

    const sheetDbResponse = await fetch(env.SHEETDB_API_URL, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        data: {
          Timestamp: new Date().toISOString(),
          Name: data.name,
          Email: data.email,
          Subject: data.subject,
          Message: data.message,
          'IP Address': ip,
          'User Agent': request.headers.get('User-Agent') || 'unknown',
        },
      }),
    });

    if (!sheetDbResponse.ok) {
      console.error('[Contact] SheetDB request failed:', sheetDbResponse.status);
      return jsonResponse(request, 502, { success: false, error: 'Failed to save your message. Please try again later.' });
    }

    return jsonResponse(request, 200, {
      success: true,
      message: "Your message has been received. I'll get back to you as soon as possible.",
    });
  } catch (error) {
    console.error('[Contact] Unexpected error:', error);
    return jsonResponse(request, 500, { success: false, error: 'An unexpected error occurred. Please try again later.' });
  }
}
