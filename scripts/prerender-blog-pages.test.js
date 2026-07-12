import { describe, expect, it } from 'vitest';
import { renderArticleHtml, renderBlogIndexHtml, renderNotFoundHtml, renderPlaylistHtml, renderStaticPageHtml } from './prerender-blog-pages.js';

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
  author: 'Dikshant Rai',
  tags: ['GCP', 'Security'],
  category: 'Security',
  platform: 'GCP',
  tools: ['Cloud Armor'],
  playlist: '',
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
    expect(html).toContain('<h1 class="text-3xl font-bold leading-tight md:text-5xl"');
    expect(html).toContain('Production Note</h1>');
    expect(html).toContain('First section.');
    expect(html).toContain('Second section.');
    expect(html).toContain('id="benefits"');
    expect(html).toContain('id="benefits-2"');
    expect(html).toContain('<link rel="canonical" href="https://techwithdikshant.com/blog/production-note"');
    expect(html).toContain('type="application/ld+json"');
    expect(html).toContain('"jobTitle":"Sr Site Reliability Engineer"');
    expect(html).toContain('<meta property="og:image:width" content="1200"');
    expect(html).toContain('<meta property="article:published_time"');
    expect(html.match(/<meta property="article:tag"/g)).toHaveLength(2);
  });
});

describe('renderBlogIndexHtml', () => {
  it('renders crawlable article links and collection metadata', () => {
    const html = renderBlogIndexHtml(shell, [post]);

    expect(html).toContain('data-prerendered="blog-listing"');
    expect(html).toContain('<h1 class="text-4xl font-bold md:text-5xl">DevOps field notes</h1>');
    expect(html).toContain('href="/blog/production-note"');
    expect(html).toContain('Original production evidence.');
    expect(html).toContain('<link rel="canonical" href="https://techwithdikshant.com/blog"');
    expect(html).toContain('data-structured-data="blog-listing"');
    expect(html.match(/<div id="root">/g)).toHaveLength(1);
  });

  it('keeps playlist-only articles out of the default listing while retaining playlist discovery', () => {
    const playlistOnlyPost = {
      ...post,
      id: 'playlist-only-note',
      slug: 'playlist-only-note',
      canonicalUrl: 'https://techwithdikshant.com/blog/playlist-only-note',
      playlist: 'GCP Security Essentials',
      playlistSlug: 'gcp-security-essentials',
      playlistOrder: 1,
      playlistOnly: true,
    };
    const html = renderBlogIndexHtml(shell, [post, playlistOnlyPost]);

    expect(html).toContain('GCP Security Essentials');
    expect(html).toContain('/playlists/gcp-security-essentials');
    expect(html).not.toContain('<a href="/blog/playlist-only-note">');
    const schema = html.match(/data-structured-data="blog-listing">([^<]+)<\/script>/)?.[1] || '{}';
    expect(JSON.parse(schema).mainEntity.numberOfItems).toBe(1);
  });
});

describe('renderPlaylistHtml', () => {
  it('renders an ordered crawlable collection with canonical metadata', () => {
    const playlistPost = {
      ...post,
      playlist: 'Production GCP Security',
      playlistSlug: 'production-gcp-security',
      playlistOrder: 1,
    };
    const html = renderPlaylistHtml(shell, {
      name: playlistPost.playlist,
      slug: playlistPost.playlistSlug,
      platform: 'GCP',
      posts: [playlistPost],
    });

    expect(html).toContain('data-prerendered="playlist"');
    expect(html).toContain('<h1 class="text-3xl font-bold md:text-4xl">Production GCP Security</h1>');
    expect(html).toContain('href="/blog/production-note"');
    expect(html).toContain('Item 1');
    expect(html).toContain('<link rel="canonical" href="https://techwithdikshant.com/playlists/production-gcp-security"');
    expect(html).toContain('data-structured-data="playlist"');
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
    expect(html).toContain('Build depth in one area');
    expect(html).toContain('href="/blog?tag=GCP"');
    expect(html).toContain('GCP security');
    expect(html).toContain('<link rel="canonical" href="https://techwithdikshant.com"');
    expect(html).toContain('data-structured-data="webpage"');
    expect(html).toContain('devops-operations-hero-960.jpg 960w');
    expect(html).toContain('width="1920" height="1053"');
    expect(html).toContain('fetchpriority="high"');
  });

  it('renders the author name and role in profile metadata', () => {
    const html = renderStaticPageHtml(shell, {
      route: '/about',
      title: 'About Dikshant Rai | Sr Site Reliability Engineer',
      description: "Learn about Dikshant Rai's reliability engineering work.",
      heading: 'Dikshant Rai',
      body: 'Sr Site Reliability Engineer documenting reliable infrastructure.'
    });

    expect(html).toContain('<title>About Dikshant Rai | Sr Site Reliability Engineer</title>');
    expect(html).toContain('Dikshant Rai</h1>');
    expect(html).toContain('src="/images/about/dikshant-rai.jpg"');
    expect(html).toContain('alt="Dikshant Rai, Sr Site Reliability Engineer"');
    expect(html).toContain('"name":"Dikshant Rai"');
    expect(html).toContain('"jobTitle":"Sr Site Reliability Engineer"');
    expect(html).toContain('"image":"https://techwithdikshant.com/images/about/dikshant-rai.jpg"');
  });
});

describe('renderBlogIndexHtml copy', () => {
  it('distinguishes searchable articles from the main feed', () => {
    const playlistOnly = {
      ...post,
      id: 'playlist-only',
      playlist: 'Production GCP Security',
      playlistSlug: 'production-gcp-security',
      playlistOrder: 2,
      playlistOnly: true,
    };
    const html = renderBlogIndexHtml(shell, [post, playlistOnly]);
    expect(html).toContain('2 searchable articles · 1 in main feed');
    expect(html).toContain('Playlist-only lessons stay out of the main feed but remain independently searchable.');
    expect(html).not.toContain('normal library');
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
