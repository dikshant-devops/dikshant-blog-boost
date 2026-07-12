#!/usr/bin/env node

import { readFile, readdir, stat } from 'fs/promises';
import { gzipSync } from 'zlib';
import { dirname, join, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';

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
  assert(searchIndex.length === posts.length, 'Search index and listing index have different post counts');
  assert(!/^\/\*\s+/m.test(redirects), 'Catch-all 200 rewrite would create soft 404s');

  const listingBytes = (await stat(join(PUBLIC, 'blog-posts-index.json'))).size;
  const searchBytes = (await stat(join(PUBLIC, 'blog-search-index.json'))).size;
  assert(listingBytes <= 100_000, `Listing index exceeds 100 KB (${listingBytes} bytes)`);
  assert(searchBytes <= 250_000, `Search index exceeds 250 KB (${searchBytes} bytes)`);

  const socialImage = join(PUBLIC, 'og-default.jpg');
  assert((await stat(socialImage)).size <= 300_000, 'Default social image exceeds 300 KB');

  await verifyHtmlFile(
    join(DIST, 'index.html'),
    'data-prerendered="static-page"',
    'https://techwithdikshant.com'
  );
  await verifyHtmlFile(
    join(DIST, 'blog', 'index.html'),
    'data-prerendered="blog-listing"',
    'https://techwithdikshant.com/blog'
  );

  for (const route of ['about', 'newsletter', 'connect']) {
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
    assert(sitemap.includes(`<loc>${canonical}</loc>`), `${post.id}: missing from sitemap`);
    assert(rss.includes(`<link>${canonical}</link>`), `${post.id}: missing from RSS`);

    const ids = Array.from(html.matchAll(/\sid="([^"]+)"/g), match => match[1]);
    assert(new Set(ids).size === ids.length, `${post.id}: duplicate HTML IDs found`);
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

  console.log(`Verified ${posts.length} articles, ${assetFiles.length} assets, and ${totalJsGzip} bytes of gzipped JavaScript.`);
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirectExecution) {
  verifyBuild().catch(error => {
    console.error('Build verification failed:', error.message);
    process.exit(1);
  });
}
