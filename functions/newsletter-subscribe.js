const PRODUCTION_ORIGINS = ['https://techwithdikshant.com'];
const LOCAL_ORIGIN_PATTERN = /^http:\/\/(?:localhost|127\.0\.0\.1)(?::\d{1,5})?$/;
const MAX_BODY_BYTES = 4096;
const MAX_EMAIL_LENGTH = 254;
const MAX_TURNSTILE_TOKEN_LENGTH = 2048;
const TURNSTILE_ACTION = 'newsletter_subscribe';

function getCorsOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  return isAllowedOriginValue(origin) ? origin : PRODUCTION_ORIGINS[0];
}

function corsHeaders(request) {
  return {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': getCorsOrigin(request),
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  };
}

// Helper function for email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

function isAllowedOriginValue(origin) {
  return PRODUCTION_ORIGINS.includes(origin) || LOCAL_ORIGIN_PATTERN.test(origin);
}

function isAllowedOrigin(request) {
  const origin = request.headers.get('Origin');
  return !origin || isAllowedOriginValue(origin);
}

function getClientKey(request) {
  return request.headers.get('CF-Connecting-IP') || 'unknown';
}

async function verifyTurnstile(token, env, request) {
  if (!env.TURNSTILE_SECRET_KEY) {
    console.error('[Newsletter] Missing Turnstile secret');
    return false;
  }

  const formData = new FormData();
  formData.append('secret', env.TURNSTILE_SECRET_KEY);
  formData.append('response', token);
  const ip = request.headers.get('CF-Connecting-IP');
  if (ip) formData.append('remoteip', ip);

  const response = await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
    method: 'POST',
    body: formData,
  });
  if (!response.ok) return false;

  const result = await response.json();
  const allowedHostnames = (env.TURNSTILE_ALLOWED_HOSTNAMES || 'techwithdikshant.com,www.techwithdikshant.com')
    .split(',')
    .map((hostname) => hostname.trim())
    .filter(Boolean);

  return result.success === true &&
    result.action === TURNSTILE_ACTION &&
    allowedHostnames.includes(result.hostname);
}

function errorResponse(status, message, request) {
  return new Response(
    JSON.stringify({ success: false, error: message }),
    { status, headers: corsHeaders(request) }
  );
}

function successResponse(message, request) {
  return new Response(
    JSON.stringify({ success: true, message }),
    { status: 200, headers: corsHeaders(request) }
  );
}

export async function onRequestPost(context) {
  return handleRequest(context);
}

export async function onRequestOptions(context) {
  return new Response(null, {
    status: 204,
    headers: {
      ...corsHeaders(context.request),
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function handleRequest(context) {
  const { request, env } = context;

  try {
    if (!isAllowedOrigin(request)) {
      return errorResponse(403, 'Request origin is not allowed', request);
    }

    const contentLength = Number(request.headers.get('Content-Length') || 0);
    if (contentLength > MAX_BODY_BYTES) {
      return errorResponse(413, 'Request body is too large', request);
    }

    const rawBody = await request.text();
    if (new TextEncoder().encode(rawBody).byteLength > MAX_BODY_BYTES) {
      return errorResponse(413, 'Request body is too large', request);
    }

    let body;
    try {
      body = JSON.parse(rawBody);
    } catch {
      return errorResponse(400, 'Invalid JSON in request body', request);
    }

    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const turnstileToken = typeof body.turnstileToken === 'string' ? body.turnstileToken : '';

    if (!email) {
      return errorResponse(400, 'Email is required', request);
    }

    if (email.length > MAX_EMAIL_LENGTH || !isValidEmail(email)) {
      return errorResponse(400, 'Invalid email format', request);
    }

    if (!turnstileToken || turnstileToken.length > MAX_TURNSTILE_TOKEN_LENGTH) {
      return errorResponse(400, 'Security verification is required', request);
    }

    if (!env.NEWSLETTER_RATE_LIMITER?.limit) {
      console.error('[Newsletter] Missing rate limiter binding');
      return errorResponse(500, 'Server configuration error', request);
    }

    const rateLimit = await env.NEWSLETTER_RATE_LIMITER.limit({ key: getClientKey(request) });
    if (!rateLimit.success) {
      return errorResponse(429, 'Too many requests. Please try again later.', request);
    }

    if (!await verifyTurnstile(turnstileToken, env, request)) {
      return errorResponse(400, 'Security verification failed. Please try again.', request);
    }

    if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
      console.error('[Newsletter] Missing Beehiiv credentials');
      return errorResponse(500, 'Server configuration error', request);
    }

    const beehiivResponse = await fetch(
      `https://api.beehiiv.com/v2/publications/${env.BEEHIIV_PUBLICATION_ID}/subscriptions`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${env.BEEHIIV_API_KEY}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: 'website',
          utm_medium: 'newsletter_page',
          referring_site: 'https://techwithdikshant.com'
        })
      }
    );

    if (beehiivResponse.status === 201) {
      return successResponse('Successfully subscribed to the newsletter. Check your email to confirm.', request);
    }

    if (beehiivResponse.status === 409) {
      return successResponse('You are already subscribed to the newsletter.', request);
    }

    if (beehiivResponse.status === 401) {
      console.error('[Newsletter] Unauthorized - check API key');
      return errorResponse(500, 'Server authentication error', request);
    }

    if (beehiivResponse.status === 429) {
      return errorResponse(429, 'Too many requests. Please try again later.', request);
    }

    const errorData = await beehiivResponse.json().catch(() => ({}));
    console.error('[Newsletter] Beehiiv error:', beehiivResponse.status, errorData);
    const errorMessage = errorData.message || errorData.error || 'Failed to subscribe. Please try again later.';
    return errorResponse(beehiivResponse.status, errorMessage, request);

  } catch (error) {
    console.error('[Newsletter] Unexpected error:', error);
    return errorResponse(500, 'An unexpected error occurred. Please try again.', request);
  }
}
