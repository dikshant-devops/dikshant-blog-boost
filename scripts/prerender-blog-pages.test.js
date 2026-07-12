import { describe, expect, it } from 'vitest';
import { renderArticleHtml, renderBlogIndexHtml, renderNotFoundHtml, renderSeriesHtml, renderStaticPageHtml } from './prerender-blog-pages.js';

const shell = `<!doctype html>
<html>
  <head>
    <title>Base title</title>
    <meta name="description" content="Base description" />
  </head>
  <body>
    <div id="root"></div>
  </body>
</html>`;

const post = {
  id: 'production-note',
  slug: 'production-note',
  fileName: 'production-note.md',
  title: 'Production Note',
  excerpt: 'Original production evidence.',
  date: '2026-07-12',
  updatedDate: '2026-07-12',
  readTime: '3 min read',
  author: 'Dikshant Sharma',
  tags: ['GCP', 'Security'],
  category: 'Security',
  platform: 'GCP',
  tools: ['Cloud Armor'],
  series: '',
  image: '/logo.svg',
  canonicalUrl: 'https://techwithdikshant.com/blog/production-note',
  headings: [
    { id: 'benefits', text: 'Benefits', level: 2, line: 1 },
    { id: 'benefits-2', text: 'Benefits', level: 2, line: 5 },
  ],
};

describe('renderArticleHtml', () => {
  it('renders crawlable article content and authoritative metadata', () => {
    const html = renderArticleHtml(
      shell,
      post,
      '## Benefits\n\nFirst section.\n\n## Benefits\n\nSecond section.'
    );

    expect(html).toContain('<main data-prerendered="article"');
    expect(html).toContain('<h1 class="mb-4 text-3xl');
    expect(html).toContain('Production Note</h1>');
    expect(html).toContain('First section.');
    expect(html).toContain('Second section.');
    expect(html).toContain('id="benefits"');
    expect(html).toContain('id="benefits-2"');
    expect(html).toContain('<link rel="canonical" href="https://techwithdikshant.com/blog/production-note"');
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('<meta property="og:image:width" content="1200"');
    expect(html).toContain('<meta property="article:published_time"');
    expect(html.match(/<meta property="article:tag"/g)).toHaveLength(2);
  });
});

describe('renderBlogIndexHtml', () => {
  it('renders crawlable article links and collection metadata', () => {
    const html = renderBlogIndexHtml(shell, [post]);

    expect(html).toContain('data-prerendered="blog-listing"');
    expect(html).toContain('<h1 class="mb-4 text-4xl');
    expect(html).toContain('href="/blog/production-note"');
    expect(html).toContain('Original production evidence.');
    expect(html).toContain('<link rel="canonical" href="https://techwithdikshant.com/blog"');
    expect(html).toContain('data-structured-data="blog-listing"');
    expect(html.match(/<div id="root">/g)).toHaveLength(1);
  });
});

describe('renderSeriesHtml', () => {
  it('renders an ordered crawlable collection with canonical metadata', () => {
    const seriesPost = {
      ...post,
      series: 'Production GCP Security',
      seriesSlug: 'production-gcp-security',
      seriesOrder: 1,
    };
    const html = renderSeriesHtml(shell, {
      name: seriesPost.series,
      slug: seriesPost.seriesSlug,
      posts: [seriesPost],
    });

    expect(html).toContain('data-prerendered="series"');
    expect(html).toContain('<h1 class="text-3xl font-bold md:text-4xl">Production GCP Security</h1>');
    expect(html).toContain('href="/blog/production-note"');
    expect(html).toContain('Part 1');
    expect(html).toContain('<link rel="canonical" href="https://techwithdikshant.com/series/production-gcp-security"');
    expect(html).toContain('data-structured-data="series"');
  });
});

describe('renderStaticPageHtml', () => {
  it('renders a crawlable canonical homepage with article links', () => {
    const html = renderStaticPageHtml(shell, {
      route: '/',
      title: 'Homepage title',
      description: 'Homepage description',
      heading: 'Homepage heading',
      body: 'Homepage body'
    }, [post]);

    expect(html).toContain('data-prerendered="static-page"');
    expect(html).toContain('Homepage heading');
    expect(html).toContain('href="/blog/production-note"');
    expect(html).toContain('<link rel="canonical" href="https://techwithdikshant.com"');
    expect(html).toContain('data-structured-data="webpage"');
  });
});

describe('renderNotFoundHtml', () => {
  it('renders a crawlable noindex error page', () => {
    const html = renderNotFoundHtml(shell);

    expect(html).toContain('data-prerendered="not-found"');
    expect(html).toContain('<h1 class="mb-4 text-4xl font-bold">404</h1>');
    expect(html).toContain('<meta name="robots" content="noindex, nofollow"');
    expect(html).not.toContain('rel="canonical"');
  });
});
