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

  it('_redirects has SPA catch-all', () => {
    const redirectsPath = resolve(publicDir, '_redirects');
    const content = readFileSync(redirectsPath, 'utf-8');
    expect(content).toContain('/index.html');
    expect(content).toContain('200');
  });

  it('_headers and _redirects do NOT exist in functions/ directory', () => {
    const functionsDir = resolve(__dirname, '../../functions');
    expect(existsSync(resolve(functionsDir, '_headers'))).toBe(false);
    expect(existsSync(resolve(functionsDir, '_redirects'))).toBe(false);
  });
});
