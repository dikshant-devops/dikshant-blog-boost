import { z } from 'zod';

// Environment interface for TypeScript support
interface Env {
  SHEETDB_API_URL: string;
  TURNSTILE_SECRET_KEY: string;
  RATE_LIMIT_MAX_REQUESTS: string;
  RATE_LIMIT_WINDOW_MS: string;
}

// Zod validation schema for contact form
const ContactSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters').max(100, 'Name is too long'),
  email: z.string().email('Invalid email address').max(255, 'Email is too long'),
  subject: z.string().min(3, 'Subject must be at least 3 characters').max(200, 'Subject is too long'),
  message: z.string().min(10, 'Message must be at least 10 characters').max(5000, 'Message is too long'),
  turnstileToken: z.string().min(1, 'CAPTCHA verification is required')
});

/**
 * Get CORS headers for the response
 */
function getCorsHeaders(origin?: string | null) {
  const allowedOrigins = ['https://techwithdikshant.com', 'http://localhost:8080'];
  const requestOrigin = origin || '';

  return {
    'Access-Control-Allow-Origin': allowedOrigins.includes(requestOrigin)
      ? requestOrigin
      : allowedOrigins[0],
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Max-Age': '86400',
  };
}

/**
 * Verify Cloudflare Turnstile token
 */
async function verifyTurnstile(
  token: string,
  secret: string,
  ip?: string
): Promise<boolean> {
  try {
    const formData = new FormData();
    formData.append('secret', secret);
    formData.append('response', token);
    if (ip) {
      formData.append('remoteip', ip);
    }

    const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
      method: 'POST',
      body: formData,
    });

    const data = await response.json() as { success: boolean };
    return data.success === true;
  } catch (error) {
    console.error('Turnstile verification error:', error);
    return false;
  }
}

/**
 * Simple rate limiting using in-memory store
 * Note: This is per-worker instance. For distributed rate limiting, use Durable Objects or KV
 */
const rateLimitStore = new Map<string, { count: number; firstRequest: number }>();

function checkRateLimit(
  ip: string,
  maxRequests: number,
  windowMs: number
): { allowed: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `ratelimit:${ip}`;

  const existing = rateLimitStore.get(key);

  if (!existing) {
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    // Clean up after window expires
    setTimeout(() => rateLimitStore.delete(key), windowMs);
    return { allowed: true };
  }

  const timePassed = now - existing.firstRequest;

  // Window expired, reset counter
  if (timePassed > windowMs) {
    rateLimitStore.set(key, { count: 1, firstRequest: now });
    setTimeout(() => rateLimitStore.delete(key), windowMs);
    return { allowed: true };
  }

  // Check if limit exceeded
  if (existing.count >= maxRequests) {
    const retryAfter = Math.ceil((windowMs - timePassed) / 1000);
    return { allowed: false, retryAfter };
  }

  // Increment counter
  existing.count++;
  return { allowed: true };
}

/**
 * POST handler for contact form submissions
 */
export async function onRequestPost(context: { request: Request; env: Env }): Promise<Response> {
  const { request, env } = context;
  const origin = request.headers.get('Origin');

  try {
    // Parse request body
    let body;
    try {
      body = await request.json();
    } catch (error) {
      return new Response(JSON.stringify({
        success: false,
        error: 'Invalid JSON in request body'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin)
        }
      });
    }

    // Validate input with Zod
    const validationResult = ContactSchema.safeParse(body);
    if (!validationResult.success) {
      const errors = validationResult.error.errors.map(err => err.message).join(', ');
      return new Response(JSON.stringify({
        success: false,
        error: `Validation error: ${errors}`
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin)
        }
      });
    }

    const validatedData = validationResult.data;

    // Get client IP address
    const ip = request.headers.get('CF-Connecting-IP') ||
               request.headers.get('X-Forwarded-For') ||
               'unknown';

    // Rate limiting
    const maxRequests = parseInt(env.RATE_LIMIT_MAX_REQUESTS || '5');
    const windowMs = parseInt(env.RATE_LIMIT_WINDOW_MS || '3600000'); // 1 hour default
    const rateLimit = checkRateLimit(ip, maxRequests, windowMs);

    if (!rateLimit.allowed) {
      return new Response(JSON.stringify({
        success: false,
        error: `Too many requests. Please try again in ${rateLimit.retryAfter} seconds.`
      }), {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': rateLimit.retryAfter?.toString() || '3600',
          ...getCorsHeaders(origin)
        }
      });
    }

    // Verify Turnstile token
    const isValidToken = await verifyTurnstile(
      validatedData.turnstileToken,
      env.TURNSTILE_SECRET_KEY,
      ip
    );

    if (!isValidToken) {
      return new Response(JSON.stringify({
        success: false,
        error: 'CAPTCHA verification failed. Please try again.'
      }), {
        status: 400,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin)
        }
      });
    }

    // Prepare data for Google Sheets via SheetDB
    const timestamp = new Date().toISOString();
    const userAgent = request.headers.get('User-Agent') || 'unknown';

    const sheetData = {
      data: {
        Timestamp: timestamp,
        Name: validatedData.name,
        Email: validatedData.email,
        Subject: validatedData.subject,
        Message: validatedData.message,
        'IP Address': ip,
        'User Agent': userAgent
      }
    };

    // Forward to SheetDB
    const sheetDbResponse = await fetch(env.SHEETDB_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(sheetData)
    });

    if (!sheetDbResponse.ok) {
      console.error('SheetDB error:', await sheetDbResponse.text());
      return new Response(JSON.stringify({
        success: false,
        error: 'Failed to save your message. Please try again later.'
      }), {
        status: 500,
        headers: {
          'Content-Type': 'application/json',
          ...getCorsHeaders(origin)
        }
      });
    }

    // Success response
    return new Response(JSON.stringify({
      success: true,
      message: 'Your message has been received! I\'ll get back to you as soon as possible.'
    }), {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin)
      }
    });

  } catch (error) {
    console.error('Contact form error:', error);

    return new Response(JSON.stringify({
      success: false,
      error: 'An unexpected error occurred. Please try again later.'
    }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
        ...getCorsHeaders(origin)
      }
    });
  }
}

/**
 * OPTIONS handler for CORS preflight
 */
export async function onRequestOptions(context: { request: Request }): Promise<Response> {
  return new Response(null, {
    status: 204,
    headers: getCorsHeaders(context.request.headers.get('Origin'))
  });
}
