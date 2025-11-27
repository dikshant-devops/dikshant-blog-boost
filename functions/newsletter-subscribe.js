// Helper function for email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Helper function for error responses
function errorResponse(status, message) {
  return new Response(
    JSON.stringify({
      success: false,
      error: message
    }),
    {
      status,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

// Helper function for success responses
function successResponse(message) {
  return new Response(
    JSON.stringify({
      success: true,
      message
    }),
    {
      status: 200,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      },
    }
  );
}

export async function onRequestPost(context) {
  return handleRequest(context);
}

export async function onRequestOptions(context) {
  return handleCORS();
}

function handleCORS() {
  return new Response(null, {
    status: 200,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization',
      'Access-Control-Max-Age': '86400',
    },
  });
}

async function handleRequest(context) {
  const { request, env } = context;

  try {
    console.log('[Newsletter] Processing subscription request');

    // Parse request body
    const { email } = await request.json();
    console.log('[Newsletter] Email received:', email);

    // Validate email
    if (!email) {
      console.log('[Newsletter] Error: No email provided');
      return errorResponse(400, 'Email is required');
    }

    if (!isValidEmail(email)) {
      console.log('[Newsletter] Error: Invalid email format');
      return errorResponse(400, 'Invalid email format');
    }

    // Check environment variables
    if (!env.BEEHIIV_API_KEY || !env.BEEHIIV_PUBLICATION_ID) {
      console.error('[Newsletter] Error: Missing Beehiiv credentials');
      return errorResponse(500, 'Server configuration error');
    }

    // Call Beehiiv API
    console.log('[Newsletter] Calling Beehiiv API...');
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

    console.log('[Newsletter] Beehiiv response status:', beehiivResponse.status);

    // Success - new subscription
    if (beehiivResponse.status === 201) {
      console.log('[Newsletter] Success: New subscription created');
      return successResponse('Successfully subscribed to newsletter! Check your email to confirm.');
    }

    // Duplicate subscription - treat as success
    if (beehiivResponse.status === 409) {
      console.log('[Newsletter] Info: Email already subscribed');
      return successResponse('You are already subscribed to our newsletter!');
    }

    // Unauthorized - API key issue
    if (beehiivResponse.status === 401) {
      console.error('[Newsletter] Error: Unauthorized - check API key');
      return errorResponse(500, 'Server authentication error');
    }

    // Rate limited
    if (beehiivResponse.status === 429) {
      console.error('[Newsletter] Error: Rate limited');
      return errorResponse(429, 'Too many requests. Please try again later.');
    }

    // Other errors
    const errorData = await beehiivResponse.json().catch(() => ({}));
    console.error('[Newsletter] Error from Beehiiv:', errorData);
    console.error('[Newsletter] Beehiiv status code:', beehiivResponse.status);

    // Return detailed error message for debugging
    const errorMessage = errorData.message || errorData.error || 'Failed to subscribe. Please try again later.';

    return errorResponse(
      beehiivResponse.status,
      errorMessage
    );

  } catch (error) {
    console.error('[Newsletter] Unexpected error:', error);
    return errorResponse(500, 'An unexpected error occurred. Please try again.');
  }
}
