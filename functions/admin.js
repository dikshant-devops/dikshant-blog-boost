const headers = {
  'Cache-Control': 'no-store',
  'Content-Type': 'text/plain; charset=utf-8',
  'X-Robots-Tag': 'noindex, nofollow, noarchive',
};

export function onRequest() {
  return new Response('Not Found', { status: 404, headers });
}
