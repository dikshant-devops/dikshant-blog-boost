#!/usr/bin/env node

import { readFile, readdir, stat } from 'fs/promises';
import { gzipSync } from 'zlib';
import { dirname, join, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { fromMarkdown } from 'mdast-util-from-markdown';

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = join(__dirname, '..');
const DIST = join(ROOT, 'dist');
const PUBLIC = join(ROOT, 'public');

function assert(condition, message) {
  if (!condition) throw new Error(message);
}

function count(html, pattern) {
  return (html.match(pattern) || []).length;
}

async function readJson(path) {
  return JSON.parse(await readFile(path, 'utf8'));
}

export function collectMarkdownImageUrls(markdown) {
  const urls = [];
  const visit = (node) => {
    if (node?.type === 'image' && typeof node.url === 'string') urls.push(node.url);
    if (Array.isArray(node?.children)) node.children.forEach(visit);
  };
  visit(fromMarkdown(markdown));
  return urls;
}

export function assertNoEditorArtifacts(markdown, fileName) {
  const forbidden = [/<\/?lov-/i, /docs\.lovable\.dev/i];
  for (const pattern of forbidden) {
    assert(!pattern.test(markdown), `${fileName}: contains editor-specific published content`);
  }
  assert(!/[ \t]+$/m.test(markdown), `${fileName}: contains trailing whitespace`);
}

async function verifyMarkdownSources(posts) {
  for (const post of posts) {
    const sourcePath = join(PUBLIC, 'blog-posts', post.fileName);
    const markdown = await readFile(sourcePath, 'utf8');
    assertNoEditorArtifacts(markdown, post.fileName);

    for (const imageUrl of collectMarkdownImageUrls(markdown)) {
      if (/^(?:https?:|data:)/i.test(imageUrl)) continue;
      const cleanPath = decodeURIComponent(imageUrl.split(/[?#]/, 1)[0]);
      const assetPath = cleanPath.startsWith('/')
        ? join(PUBLIC, cleanPath.slice(1))
        : resolve(dirname(sourcePath), cleanPath);
      assert(assetPath.startsWith(PUBLIC), `${post.fileName}: image escapes the public directory: ${imageUrl}`);
      try {
        await stat(assetPath);
      } catch {
        throw new Error(`${post.fileName}: missing local image: ${imageUrl}`);
      }
    }
  }
}

async function verifyHtmlFile(path, expectedMarker, expectedCanonical) {
  const html = await readFile(path, 'utf8');
  assert(html.includes(expectedMarker), `${path}: missing prerendered content marker`);
  assert(count(html, /<title>/g) === 1, `${path}: expected exactly one title`);
  assert(count(html, /<meta name="description"/g) === 1, `${path}: expected exactly one description`);
  assert(count(html, /<link rel="canonical"/g) === 1, `${path}: expected exactly one canonical`);
  assert(html.includes(`href="${expectedCanonical}"`), `${path}: incorrect canonical URL`);
  assert(count(html, /<h1(?:\s|>)/g) === 1, `${path}: expected exactly one H1`);
  return html;
}

export async function verifyBuild() {
  const [posts, searchIndex, sitemap, rss, redirects] = await Promise.all([
    readJson(join(PUBLIC, 'blog-posts-index.json')),
    readJson(join(PUBLIC, 'blog-search-index.json')),
    readFile(join(PUBLIC, 'sitemap.xml'), 'utf8'),
    readFile(join(PUBLIC, 'rss.xml'), 'utf8'),
    readFile(join(PUBLIC, '_redirects'), 'utf8')
  ]);

  assert(posts.length > 0, 'Blog listing index is empty');
  assert(posts.every(post => !Object.hasOwn(post, 'searchText')), 'Listing index contains full article search text');
  assert(posts.every(post => !Object.hasOwn(post, 'headings')), 'Listing index contains article heading details');
  assert(posts.every(post => !Object.hasOwn(post, 'series')), 'Listing index contains deprecated series metadata');
  assert(searchIndex.version === 1, 'Unsupported search index version');
  assert(Array.isArray(searchIndex.documents) && searchIndex.documents.length === posts.length, 'Search index and listing index have different post counts');
  assert(searchIndex.documents.every(document => typeof document.id === 'string' && typeof document.terms === 'string' && typeof document.boost === 'string'), 'Search index contains invalid documents');
  assert(!searchIndex.documents.some(document => Object.hasOwn(document, 'searchText')), 'Search index contains unbounded article text');
  assert(!/^\/\*\s+/m.test(redirects), 'Catch-all 200 rewrite would create soft 404s');
  assert(redirects.includes('/series/:slug /playlists/:slug 301'), 'Legacy series redirect is missing');
  await verifyMarkdownSources(posts);

  const listingBytes = (await stat(join(PUBLIC, 'blog-posts-index.json'))).size;
  const searchBytes = (await stat(join(PUBLIC, 'blog-search-index.json'))).size;
  assert(listingBytes <= 100_000, `Listing index exceeds 100 KB (${listingBytes} bytes)`);
  assert(searchBytes <= 250_000, `Search index exceeds 250 KB (${searchBytes} bytes)`);

  const socialImage = join(PUBLIC, 'og-default.jpg');
  assert((await stat(socialImage)).size <= 300_000, 'Default social image exceeds 300 KB');
  const homepageHero = join(PUBLIC, 'images', 'site', 'devops-operations-hero.jpg');
  assert((await stat(homepageHero)).size <= 300_000, 'Homepage hero image exceeds 300 KB');
  for (const [file, maxBytes] of [['devops-operations-hero-960.jpg', 100_000], ['devops-operations-hero-1440.jpg', 180_000]]) {
    assert((await stat(join(PUBLIC, 'images', 'site', file))).size <= maxBytes, `${file} exceeds ${maxBytes} bytes`);
  }
  const authorPortrait = join(PUBLIC, 'images', 'about', 'dikshant-rai.jpg');
  assert((await stat(authorPortrait)).size <= 250_000, 'Author portrait exceeds 250 KB');

  await verifyHtmlFile(
    join(DIST, 'index.html'),
    'data-prerendered="static-page"',
    'https://techwithdikshant.com'
  );
  const blogListingHtml = await verifyHtmlFile(
    join(DIST, 'blog', 'index.html'),
    'data-prerendered="blog-listing"',
    'https://techwithdikshant.com/blog'
  );

  for (const route of ['about', 'newsletter', 'connect', 'privacy', 'terms']) {
    await verifyHtmlFile(
      join(DIST, route, 'index.html'),
      'data-prerendered="static-page"',
      `https://techwithdikshant.com/${route}`
    );
  }

  for (const post of posts) {
    const canonical = `https://techwithdikshant.com/blog/${post.id}`;
    const routePath = join(DIST, 'blog', post.id, 'index.html');
    const flatPath = join(DIST, 'blog', `${post.id}.html`);
    const details = await readJson(join(PUBLIC, 'blog-post-details', `${post.id}.json`));
    const html = await verifyHtmlFile(routePath, 'data-prerendered="article"', canonical);
    const flatHtml = await readFile(flatPath, 'utf8');

    assert(flatHtml === html, `${post.id}: clean and trailing-slash route output differs`);
    assert(details.id === post.id && Array.isArray(details.headings), `${post.id}: invalid detail metadata`);
    assert(count(html, /data-structured-data="article"/g) === 1, `${post.id}: expected one article schema`);
    assert(count(html, /<meta property="article:published_time"/g) === 1, `${post.id}: publication metadata missing`);
    const socialUrl = post.image.startsWith('http')
      ? post.image
      : `https://techwithdikshant.com${post.image}`;
    assert(html.includes(socialUrl), `${post.id}: social image missing`);
    if (!post.image.startsWith('http')) {
      assert((await stat(join(PUBLIC, post.image.replace(/^\/+/, '')))).size <= 300_000, `${post.id}: social image exceeds 300 KB`);
    }
    assert(sitemap.includes(`<loc>${canonical}</loc>`), `${post.id}: missing from sitemap`);
    if (post.playlistOnly) {
      assert(!rss.includes(`<link>${canonical}</link>`), `${post.id}: playlist-only article leaked into RSS`);
      assert(!blogListingHtml.includes(`href="/blog/${post.id}"`), `${post.id}: playlist-only article leaked into the default blog listing`);
      assert(post.playlist && post.playlistSlug, `${post.id}: playlist-only article has no playlist`);
    } else {
      assert(rss.includes(`<link>${canonical}</link>`), `${post.id}: missing from RSS`);
    }

    const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), match => match[1]);
    assert(new Set(ids).size === ids.length, `${post.id}: duplicate HTML IDs found`);
  }

  const playlistSlugs = [...new Set(posts.map(post => post.playlistSlug).filter(Boolean))];
  for (const playlistSlug of playlistSlugs) {
    const canonical = `https://techwithdikshant.com/playlists/${playlistSlug}`;
    const routePath = join(DIST, 'playlists', playlistSlug, 'index.html');
    const flatPath = join(DIST, 'playlists', `${playlistSlug}.html`);
    const html = await verifyHtmlFile(routePath, 'data-prerendered="playlist"', canonical);
    const flatHtml = await readFile(flatPath, 'utf8');

    assert(flatHtml === html, `${playlistSlug}: clean and trailing-slash playlist output differs`);
    assert(count(html, /data-structured-data="playlist"/g) === 1, `${playlistSlug}: expected one playlist schema`);
    assert(sitemap.includes(`<loc>${canonical}</loc>`), `${playlistSlug}: missing from sitemap`);
  }

  const assetFiles = (await readdir(join(DIST, 'assets'))).filter(file => file.endsWith('.js') || file.endsWith('.css'));
  assert(!assetFiles.some(file => /admin/i.test(file)), 'Admin code is present in the production assets');
  assert(!assetFiles.some(file => /query/i.test(file)), 'Unused query library chunk is present');

  let totalJsGzip = 0;
  for (const file of assetFiles) {
    const content = await readFile(join(DIST, 'assets', file));
    const gzipBytes = gzipSync(content).length;
    if (file.endsWith('.js')) {
      totalJsGzip += gzipBytes;
      assert(gzipBytes <= 60_000, `${file}: JavaScript chunk exceeds 60 KB gzip`);
    } else {
      assert(gzipBytes <= 20_000, `${file}: CSS exceeds 20 KB gzip`);
    }
  }
  assert(totalJsGzip <= 220_000, `Total JavaScript exceeds 220 KB gzip (${totalJsGzip} bytes)`);

  const builtRoot = await readFile(join(DIST, 'index.html'), 'utf8');
  assert(!builtRoot.includes('challenges.cloudflare.com/turnstile/v0/api.js'), 'Turnstile is loaded globally');

  const notFoundHtml = await readFile(join(DIST, '404.html'), 'utf8');
  assert(notFoundHtml.includes('data-prerendered="not-found"'), 'Custom 404 page is missing');
  assert(notFoundHtml.includes('content="noindex, nofollow"'), 'Custom 404 page must be noindex');

  const functionRoutes = await readJson(join(DIST, '_routes.json'));
  assert(functionRoutes.version === 1, 'Invalid Cloudflare Functions route manifest');
  for (const route of ['/admin', '/api/contact', '/newsletter-subscribe']) {
    assert(functionRoutes.include.includes(route), `Function route missing from _routes.json: ${route}`);
  }

  console.log(`Verified ${posts.length} articles, ${playlistSlugs.length} playlists, ${assetFiles.length} assets, and ${totalJsGzip} bytes of gzipped JavaScript.`);
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirectExecution) {
  verifyBuild().catch(error => {
    console.error('Build verification failed:', error.message);
    process.exit(1);
  });
}
