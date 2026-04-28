const ALLOWED_ORIGINS = ['https://techwithdikshant.com', 'http://localhost:8080'];

function getCorsOrigin(request) {
  const origin = request.headers.get('Origin') || '';
  return ALLOWED_ORIGINS.includes(origin) ? origin : ALLOWED_ORIGINS[0];
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
    const { email } = await request.json();

    if (!email) {
      return errorResponse(400, 'Email is required', request);
    }

    if (!isValidEmail(email)) {
      return errorResponse(400, 'Invalid email format', request);
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
          email: email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: 'website',
          utm_medium: 'newsletter_page',
          referring_site: 'https://techwithdikshant.com'
        })
      }
    );

    if (beehiivResponse.status === 201) {
      return successResponse('Successfully subscribed to newsletter! Check your email to confirm.', request);
    }

    if (beehiivResponse.status === 409) {
      return successResponse('You are already subscribed to our newsletter!', request);
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
