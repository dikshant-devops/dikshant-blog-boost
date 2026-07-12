import { describe, expect, it } from 'vitest';
import { onRequest } from './admin.js';

describe('admin route', () => {
  it('returns a non-indexable 404 in production', async () => {
    const response = onRequest();

    expect(response.status).toBe(404);
    expect(response.headers.get('Cache-Control')).toBe('no-store');
    expect(response.headers.get('X-Robots-Tag')).toContain('noindex');
    await expect(response.text()).resolves.toBe('Not Found');
  });
});
