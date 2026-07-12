#!/usr/bin/env node

/**
 * Generate blog posts manifest
 * This script scans the public/blog-posts directory and creates a manifest file
 * listing all markdown files. This is needed because Vite's import.meta.glob
 * cannot access the /public folder.
 *
 * Run this script whenever you add new blog posts:
 * node scripts/generate-blog-manifest.js
 */

import { access, mkdir, readdir, readFile, rm, writeFile } from 'fs/promises';
import { join, dirname, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import { SITE_URL, parseBlogMarkdown, validateBlogPosts } from './lib/content.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const BLOG_POSTS_DIR = join(__dirname, '../public/blog-posts');
const PUBLIC_DIR = join(__dirname, '../public');
const MANIFEST_FILE = join(__dirname, '../public/blog-posts-manifest.json');
const INDEX_FILE = join(__dirname, '../public/blog-posts-index.json');
const SEARCH_INDEX_FILE = join(__dirname, '../public/blog-search-index.json');
const DETAILS_DIR = join(__dirname, '../public/blog-post-details');
const SITEMAP_FILE = join(__dirname, '../public/sitemap.xml');
const RSS_FILE = join(__dirname, '../public/rss.xml');
const ROBOTS_FILE = join(__dirname, '../public/robots.txt');

const STATIC_ROUTES = ['/', '/blog', '/about', '/newsletter', '/connect'];

function xmlEscape(value) {
  return String(value)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&apos;');
}

export function buildSitemap(posts) {
  const siteUrl = SITE_URL.replace(/\/$/, '');
  const staticUrls = STATIC_ROUTES.map(route => ({
    loc: `${siteUrl}${route === '/' ? '' : route}`,
    lastmod: new Date().toISOString().slice(0, 10),
    priority: route === '/' ? '1.0' : '0.8'
  }));
  const postUrls = posts.map(post => ({
    loc: post.canonicalUrl,
    lastmod: post.updatedDate || post.date,
    priority: '0.9'
  }));
  const seriesBySlug = new Map();
  for (const post of posts) {
    if (!post.series || !post.seriesSlug) continue;
    const existing = seriesBySlug.get(post.seriesSlug);
    const lastmod = post.updatedDate || post.date;
    if (!existing || lastmod > existing.lastmod) {
      seriesBySlug.set(post.seriesSlug, {
        loc: `${siteUrl}/series/${post.seriesSlug}`,
        lastmod,
        priority: '0.7'
      });
    }
  }

  const urls = [...staticUrls, ...seriesBySlug.values(), ...postUrls]
    .map(item => [
      '  <url>',
      `    <loc>${xmlEscape(item.loc)}</loc>`,
      `    <lastmod>${xmlEscape(item.lastmod)}</lastmod>`,
      `    <priority>${item.priority}</priority>`,
      '  </url>'
    ].join('\n'))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

function buildRss(posts) {
  const siteUrl = SITE_URL.replace(/\/$/, '');
  const items = posts
    .slice(0, 25)
    .map(post => [
      '    <item>',
      `      <title>${xmlEscape(post.title)}</title>`,
      `      <link>${xmlEscape(post.canonicalUrl)}</link>`,
      `      <guid>${xmlEscape(post.canonicalUrl)}</guid>`,
      `      <pubDate>${new Date(post.date).toUTCString()}</pubDate>`,
      `      <description>${xmlEscape(post.excerpt)}</description>`,
      ...post.tags.map(tag => `      <category>${xmlEscape(tag)}</category>`),
      '    </item>'
    ].join('\n'))
    .join('\n');

  return `<?xml version="1.0" encoding="UTF-8"?>\n<rss version="2.0">\n  <channel>\n    <title>Tech With Dikshant</title>\n    <link>${xmlEscape(siteUrl)}</link>\n    <description>DevOps tutorials, cloud engineering notes, CI/CD guides, and technical implementation logs.</description>\n    <language>en-us</language>\n    <lastBuildDate>${new Date().toUTCString()}</lastBuildDate>\n${items}\n  </channel>\n</rss>\n`;
}

function buildRobots() {
  const siteUrl = SITE_URL.replace(/\/$/, '');
  return [
    'User-agent: Googlebot',
    'Allow: /',
    '',
    'User-agent: Bingbot',
    'Allow: /',
    '',
    'User-agent: Twitterbot',
    'Allow: /',
    '',
    'User-agent: facebookexternalhit',
    'Allow: /',
    '',
    'User-agent: *',
    'Allow: /',
    '',
    `Sitemap: ${siteUrl}/sitemap.xml`,
    ''
  ].join('\n');
}

async function generateManifest() {
  try {
    console.log('Scanning blog posts directory...');
    const files = await readdir(BLOG_POSTS_DIR);

    // Filter only .md files
    const markdownFiles = files.filter(file => file.endsWith('.md')).sort((a, b) => a.localeCompare(b));

    console.log(`Found ${markdownFiles.length} markdown files:`);
    markdownFiles.forEach(file => console.log(`  - ${file}`));

    const posts = [];
    for (const filename of markdownFiles) {
      const fullPath = join(BLOG_POSTS_DIR, filename);
      const rawContent = await readFile(fullPath, 'utf-8');
      posts.push(parseBlogMarkdown(filename, rawContent));
    }

    validateBlogPosts(posts);

    for (const post of posts) {
      if (post.image.startsWith('/')) {
        await access(join(PUBLIC_DIR, post.image.replace(/^\/+/, '')))
          .catch(() => {
            throw new Error(`${post.fileName}: image asset does not exist: ${post.image}`);
          });
      }
    }

    posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

    // Write manifest file
    await writeFile(MANIFEST_FILE, JSON.stringify(markdownFiles, null, 2));
    const listingPosts = posts.map(({ searchText: _searchText, headings: _headings, ...post }) => post);
    const searchIndex = posts.map(({ id, searchText }) => ({ id, searchText }));

    await rm(DETAILS_DIR, { recursive: true, force: true });
    await mkdir(DETAILS_DIR, { recursive: true });
    await writeFile(INDEX_FILE, JSON.stringify(listingPosts, null, 2));
    await writeFile(SEARCH_INDEX_FILE, JSON.stringify(searchIndex));
    await Promise.all(posts.map(post => writeFile(
      join(DETAILS_DIR, `${post.id}.json`),
      JSON.stringify({ id: post.id, headings: post.headings })
    )));
    await writeFile(SITEMAP_FILE, buildSitemap(posts));
    await writeFile(RSS_FILE, buildRss(posts));
    await writeFile(ROBOTS_FILE, buildRobots());

    console.log('\nManifest generated successfully at:', MANIFEST_FILE);
    console.log('Blog index generated successfully at:', INDEX_FILE);
    console.log('Search index generated successfully at:', SEARCH_INDEX_FILE);
    console.log('Sitemap generated successfully at:', SITEMAP_FILE);
    console.log('RSS feed generated successfully at:', RSS_FILE);
  } catch (error) {
    console.error('Error generating manifest:', error);
    process.exit(1);
  }
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirectExecution) generateManifest();
