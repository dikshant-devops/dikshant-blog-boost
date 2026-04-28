import { describe, it, expect, afterEach } from 'vitest';
import { renderHook } from '@testing-library/react';
import { useSEO, useArticleStructuredData } from './useSEO';

afterEach(() => {
  // Clean up any SEO meta tags left over
  document.querySelectorAll('meta[data-seo="true"]').forEach(el => el.remove());
  document.querySelectorAll('script[data-structured-data="article"]').forEach(el => el.remove());
  document.querySelectorAll('link[rel="canonical"]').forEach(el => el.remove());
});

describe('useSEO', () => {
  it('sets document title', () => {
    renderHook(() => useSEO({ title: 'Test Page', description: 'A test' }));
    expect(document.title).toBe('Test Page');
  });

  it('creates OG meta tags', () => {
    renderHook(() => useSEO({ title: 'OG Test', description: 'OG desc' }));

    const ogTitle = document.querySelector('meta[property="og:title"]');
    expect(ogTitle).toBeTruthy();
    expect(ogTitle?.getAttribute('content')).toBe('OG Test');

    const ogDesc = document.querySelector('meta[property="og:description"]');
    expect(ogDesc?.getAttribute('content')).toBe('OG desc');
  });

  it('creates Twitter card meta tags', () => {
    renderHook(() => useSEO({ title: 'TW Test', description: 'TW desc' }));

    const twCard = document.querySelector('meta[name="twitter:card"]');
    expect(twCard?.getAttribute('content')).toBe('summary_large_image');

    const twTitle = document.querySelector('meta[name="twitter:title"]');
    expect(twTitle?.getAttribute('content')).toBe('TW Test');
  });

  it('sets canonical URL', () => {
    renderHook(() => useSEO({ title: 'Canon', description: 'test', url: 'https://example.com/page' }));

    const canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    expect(canonical).toBeTruthy();
    expect(canonical.href).toBe('https://example.com/page');
  });

  it('marks all created meta tags with data-seo="true"', () => {
    renderHook(() => useSEO({ title: 'Marked', description: 'marked desc' }));

    const seoMetas = document.querySelectorAll('meta[data-seo="true"]');
    expect(seoMetas.length).toBeGreaterThan(0);
  });

  it('cleans up meta tags on unmount', () => {
    const { unmount } = renderHook(() => useSEO({ title: 'Cleanup', description: 'cleanup' }));

    expect(document.querySelectorAll('meta[data-seo="true"]').length).toBeGreaterThan(0);

    unmount();

    expect(document.querySelectorAll('meta[data-seo="true"]').length).toBe(0);
  });

  it('includes article:published_time when publishedTime is provided', () => {
    renderHook(() => useSEO({
      title: 'Article', description: 'desc', publishedTime: '2024-01-15'
    }));

    const pubTime = document.querySelector('meta[property="article:published_time"]');
    expect(pubTime?.getAttribute('content')).toBe('2024-01-15');
  });

  it('includes article:tag for each tag provided', () => {
    renderHook(() => useSEO({
      title: 'Tags', description: 'desc', tags: ['Docker', 'K8s']
    }));

    const tagMetas = document.querySelectorAll('meta[property="article:tag"]');
    expect(tagMetas.length).toBe(2);
    const contents = Array.from(tagMetas).map(m => m.getAttribute('content'));
    expect(contents).toContain('Docker');
    expect(contents).toContain('K8s');
  });

  it('uses default author "Dikshant" when not provided', () => {
    renderHook(() => useSEO({ title: 'Default', description: 'desc' }));

    const author = document.querySelector('meta[name="author"]');
    expect(author?.getAttribute('content')).toBe('Dikshant');
  });

  it('uses default image /logo.svg when not provided', () => {
    renderHook(() => useSEO({ title: 'Default', description: 'desc' }));

    const ogImage = document.querySelector('meta[property="og:image"]');
    expect(ogImage?.getAttribute('content')).toBe('/logo.svg');
  });

  it('skips meta tags with empty content', () => {
    renderHook(() => useSEO({ title: 'NoKeywords', description: 'desc' }));

    // keywords defaults to '' so it should be skipped
    const keywords = document.querySelector('meta[name="keywords"]');
    expect(keywords).toBeNull();
  });
});

describe('useArticleStructuredData', () => {
  it('creates a JSON-LD script element', () => {
    renderHook(() => useArticleStructuredData({
      title: 'Article Title',
      description: 'Article desc',
      author: 'Dikshant',
      datePublished: '2024-01-15',
    }));

    const script = document.querySelector('script[data-structured-data="article"]');
    expect(script).toBeTruthy();
    expect(script?.getAttribute('type')).toBe('application/ld+json');
  });

  it('contains correct structured data fields', () => {
    renderHook(() => useArticleStructuredData({
      title: 'My Article',
      description: 'My desc',
      author: 'Dikshant',
      datePublished: '2024-06-01',
      tags: ['Docker', 'CI/CD'],
      readTime: '5 min read',
    }));

    const script = document.querySelector('script[data-structured-data="article"]');
    const data = JSON.parse(script?.textContent || '{}');

    expect(data['@context']).toBe('https://schema.org');
    expect(data['@type']).toBe('BlogPosting');
    expect(data.headline).toBe('My Article');
    expect(data.description).toBe('My desc');
    expect(data.author.name).toBe('Dikshant');
    expect(data.datePublished).toBe('2024-06-01');
    expect(data.keywords).toBe('Docker, CI/CD');
    expect(data.timeRequired).toBe('5 min read');
  });

  it('uses datePublished as fallback for dateModified', () => {
    renderHook(() => useArticleStructuredData({
      title: 'T', description: 'D', author: 'A', datePublished: '2024-01-01',
    }));

    const script = document.querySelector('script[data-structured-data="article"]');
    const data = JSON.parse(script?.textContent || '{}');
    expect(data.dateModified).toBe('2024-01-01');
  });

  it('cleans up script on unmount', () => {
    const { unmount } = renderHook(() => useArticleStructuredData({
      title: 'T', description: 'D', author: 'A', datePublished: '2024-01-01',
    }));

    expect(document.querySelector('script[data-structured-data="article"]')).toBeTruthy();
    unmount();
    expect(document.querySelector('script[data-structured-data="article"]')).toBeNull();
  });
});
