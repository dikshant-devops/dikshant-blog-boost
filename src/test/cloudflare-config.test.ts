import { describe, it, expect } from 'vitest';
import { readFileSync, existsSync } from 'fs';
import { resolve } from 'path';

describe('Cloudflare Pages configuration', () => {
  const publicDir = resolve(__dirname, '../../public');

  it('_headers file exists in public/ directory', () => {
    const headersPath = resolve(publicDir, '_headers');
    expect(existsSync(headersPath)).toBe(true);
  });

  it('_headers includes security headers', () => {
    const headersPath = resolve(publicDir, '_headers');
    const content = readFileSync(headersPath, 'utf-8');
    expect(content).toContain('X-Frame-Options: DENY');
    expect(content).toContain('X-Content-Type-Options: nosniff');
    expect(content).toContain('Referrer-Policy');
    expect(content).toContain('Strict-Transport-Security');
    expect(content).toContain('Content-Security-Policy');
    expect(content).toContain("script-src 'self' https://challenges.cloudflare.com");
    const scriptDirective = content.match(/script-src\s+([^;]+)/)?.[1] || '';
    expect(scriptDirective).not.toContain("'unsafe-inline'");
    expect(content).not.toContain('X-XSS-Protection');
  });

  it('_headers includes cache headers for assets', () => {
    const headersPath = resolve(publicDir, '_headers');
    const content = readFileSync(headersPath, 'utf-8');
    expect(content).toContain('/assets/*');
    expect(content).toContain('max-age=31536000');
  });

  it('_redirects file exists in public/ directory', () => {
    const redirectsPath = resolve(publicDir, '_redirects');
    expect(existsSync(redirectsPath)).toBe(true);
  });

  it('_redirects does not turn unknown routes into soft 404s', () => {
    const redirectsPath = resolve(publicDir, '_redirects');
    const content = readFileSync(redirectsPath, 'utf-8');
    expect(content).not.toMatch(/^\/\*\s+/m);
    expect(content).not.toContain('/index.html');
  });

  it('build scripts generate and verify direct HTML routes', () => {
    const packageJson = JSON.parse(readFileSync(resolve(__dirname, '../../package.json'), 'utf-8'));
    expect(packageJson.scripts.postbuild).toContain('prerender-blog-pages.js');
    expect(packageJson.scripts.postbuild).toContain('verify-build.js');
  });

  it('production admin route has a dedicated denial function', () => {
    expect(existsSync(resolve(__dirname, '../../functions/admin.js'))).toBe(true);
  });

  it('limits Function invocation to dynamic routes', () => {
    const routes = JSON.parse(readFileSync(resolve(publicDir, '_routes.json'), 'utf-8'));
    expect(routes).toEqual({
      version: 1,
      include: ['/admin', '/api/contact', '/newsletter-subscribe'],
      exclude: []
    });
  });

  it('_headers and _redirects do NOT exist in functions/ directory', () => {
    const functionsDir = resolve(__dirname, '../../functions');
    expect(existsSync(resolve(functionsDir, '_headers'))).toBe(false);
    expect(existsSync(resolve(functionsDir, '_redirects'))).toBe(false);
  });
});
