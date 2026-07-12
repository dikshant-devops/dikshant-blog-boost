#!/usr/bin/env node

import { mkdir, readFile, writeFile } from 'fs/promises';
import { dirname, join, resolve } from 'path';
import { fileURLToPath, pathToFileURL } from 'url';
import React from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';
import matter from 'gray-matter';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DIST_DIR = join(__dirname, '../dist');
const INDEX_HTML = join(DIST_DIR, 'index.html');
const POSTS_INDEX = join(__dirname, '../public/blog-posts-index.json');
const BLOG_POSTS_DIR = join(__dirname, '../public/blog-posts');
const BLOG_POST_DETAILS_DIR = join(__dirname, '../public/blog-post-details');

function htmlEscape(value) {
  return String(value || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;');
}

function replaceOrInsertMeta(html, selector, value) {
  const escaped = htmlEscape(value);
  const pattern = selector.startsWith('name=')
    ? new RegExp(`<meta\\s+name="${selector.slice(5)}"\\s+content="[^"]*"\\s*/?>`, 'i')
    : new RegExp(`<meta\\s+property="${selector.slice(9)}"\\s+content="[^"]*"\\s*/?>`, 'i');
  const tag = selector.startsWith('name=')
    ? `<meta name="${selector.slice(5)}" content="${escaped}" />`
    : `<meta property="${selector.slice(9)}" content="${escaped}" />`;
  if (pattern.test(html)) return html.replace(pattern, tag);
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function replaceCanonical(html, url) {
  const tag = `<link rel="canonical" href="${htmlEscape(url)}" />`;
  if (/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i.test(html)) {
    return html.replace(/<link\s+rel="canonical"\s+href="[^"]*"\s*\/?>/i, tag);
  }
  return html.replace('</head>', `    ${tag}\n  </head>`);
}

function injectStructuredData(html, structuredData, key = 'article') {
  const json = JSON.stringify(structuredData).replace(/</g, '\\u003c');
  return html.replace(
    '</head>',
    `    <script type="application/ld+json" data-structured-data="${key}">${json}</script>\n  </head>`
  );
}

function injectArticleMeta(html, post) {
  const tags = [
    `<meta property="article:published_time" content="${htmlEscape(new Date(post.date).toISOString())}" />`,
    `<meta property="article:modified_time" content="${htmlEscape(new Date(post.updatedDate || post.date).toISOString())}" />`,
    `<meta property="article:author" content="${htmlEscape(post.author)}" />`,
    ...post.tags.map(tag => `<meta property="article:tag" content="${htmlEscape(tag)}" />`)
  ];
  return html.replace('</head>', `    ${tags.join('\n    ')}\n  </head>`);
}

function headingId(post, node, fallback) {
  const line = node?.position?.start?.line;
  return post.headings?.find(heading => heading.line === line)?.id || fallback;
}

function renderMarkdown(post, markdown) {
  const components = {
    h2: ({ node, children }) => React.createElement(
      'h2',
      { id: headingId(post, node, String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) },
      children
    ),
    h3: ({ node, children }) => React.createElement(
      'h3',
      { id: headingId(post, node, String(children).toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-+|-+$/g, '')) },
      children
    ),
    a: ({ href, children }) => React.createElement(
      'a',
      href?.startsWith('/') || href?.startsWith('#')
        ? { href }
        : { href, target: '_blank', rel: 'noopener noreferrer' },
      children
    ),
    img: ({ src, alt }) => React.createElement('img', { src, alt: alt || '', loading: 'lazy' })
  };

  return renderToStaticMarkup(
    React.createElement(ReactMarkdown, { remarkPlugins: [remarkGfm], components }, markdown)
  );
}

function renderStaticArticle(post, markdown) {
  const renderedMarkdown = renderMarkdown(post, markdown);
  const formattedDate = new Intl.DateTimeFormat('en-US', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
    timeZone: 'UTC'
  }).format(new Date(`${post.date}T00:00:00Z`));
  const tags = post.tags.map(tag => `<span class="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold">${htmlEscape(tag)}</span>`).join('');
  const seriesMarkup = post.series && post.seriesSlug
    ? `<p class="mt-3"><a href="/series/${encodeURIComponent(post.seriesSlug)}">${htmlEscape(post.series)}${post.seriesOrder ? ` · Part ${post.seriesOrder}` : ''}</a></p>`
    : '';

  return `<div id="root">
    <main data-prerendered="article" class="container mx-auto max-w-4xl px-4 py-8">
      <nav aria-label="Breadcrumb" class="mb-6 text-sm"><a href="/blog">Back to Blog</a></nav>
      <article>
        <header class="mb-8">
          <div class="mb-4 flex flex-wrap gap-2">${tags}</div>
          <h1 class="mb-4 text-3xl font-bold leading-tight md:text-4xl lg:text-5xl">${htmlEscape(post.title)}</h1>
          <p class="text-muted-foreground"><time datetime="${htmlEscape(post.date)}">${formattedDate}</time> · ${htmlEscape(post.readTime)}</p>
          ${seriesMarkup}
        </header>
        <div class="prose prose-lg max-w-none dark:prose-invert">${renderedMarkdown}</div>
      </article>
    </main>
  </div>`;
}

export function renderArticleHtml(shell, post, markdown) {
  const keywords = [...new Set([post.category, post.platform, ...post.tools, ...post.tags].filter(Boolean))].join(', ');
  const image = post.image?.startsWith('http')
    ? post.image
    : `https://techwithdikshant.com${post.image || '/og-default.jpg'}`;

  const pageTitle = post.title.length <= 49 ? `${post.title} | Tech With Dikshant` : post.title;
  let html = shell.replace(/<title>[^<]*<\/title>/i, `<title>${htmlEscape(pageTitle)}</title>`);
  html = replaceOrInsertMeta(html, 'name=description', post.excerpt);
  html = replaceOrInsertMeta(html, 'name=keywords', keywords);
  html = replaceOrInsertMeta(html, 'name=author', post.author);
  html = replaceOrInsertMeta(html, 'property=og:title', pageTitle);
  html = replaceOrInsertMeta(html, 'property=og:description', post.excerpt);
  html = replaceOrInsertMeta(html, 'property=og:type', 'article');
  html = replaceOrInsertMeta(html, 'property=og:image', image);
  html = replaceOrInsertMeta(html, 'property=og:image:width', '1200');
  html = replaceOrInsertMeta(html, 'property=og:image:height', '630');
  html = replaceOrInsertMeta(html, 'property=og:url', post.canonicalUrl);
  html = replaceOrInsertMeta(html, 'name=twitter:title', pageTitle);
  html = replaceOrInsertMeta(html, 'name=twitter:description', post.excerpt);
  html = replaceOrInsertMeta(html, 'name=twitter:image', image);
  html = replaceCanonical(html, post.canonicalUrl);
  html = injectArticleMeta(html, post);
  html = injectStructuredData(html, {
    '@context': 'https://schema.org',
    '@type': 'BlogPosting',
    headline: post.title,
    description: post.excerpt,
    image,
    author: {
      '@type': 'Person',
      name: post.author,
      url: 'https://techwithdikshant.com/about'
    },
    publisher: {
      '@type': 'Organization',
      name: 'Tech With Dikshant',
      logo: {
        '@type': 'ImageObject',
        url: 'https://techwithdikshant.com/logo.svg'
      }
    },
    datePublished: new Date(post.date).toISOString(),
    dateModified: new Date(post.updatedDate || post.date).toISOString(),
    mainEntityOfPage: {
      '@type': 'WebPage',
      '@id': post.canonicalUrl
    },
    keywords,
    articleSection: post.category,
    timeRequired: post.readTime
  });
  html = html.replace('<div id="root"></div>', renderStaticArticle(post, markdown));
  return html;
}

function collectSeries(posts) {
  const collections = new Map();
  for (const post of posts) {
    if (!post.series || !post.seriesSlug) continue;
    const existing = collections.get(post.seriesSlug) || {
      name: post.series,
      slug: post.seriesSlug,
      posts: []
    };
    existing.posts.push(post);
    collections.set(post.seriesSlug, existing);
  }

  return Array.from(collections.values())
    .map(series => ({
      ...series,
      posts: series.posts.sort((a, b) =>
        (a.seriesOrder ?? Number.MAX_SAFE_INTEGER) - (b.seriesOrder ?? Number.MAX_SAFE_INTEGER)
        || new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderStaticSeries(series) {
  const articles = series.posts.map((post, index) => `
    <li>
      <a href="/blog/${encodeURIComponent(post.id)}" class="block rounded-md border p-5">
        <p class="mb-2 text-sm font-semibold">Part ${post.seriesOrder ?? index + 1}</p>
        <h2 class="mb-2 text-xl font-semibold">${htmlEscape(post.title)}</h2>
        <p class="text-muted-foreground">${htmlEscape(post.excerpt)}</p>
      </a>
    </li>`).join('');

  return `<div id="root">
    <main data-prerendered="series" class="container mx-auto max-w-4xl px-4 py-10">
      <nav aria-label="Breadcrumb" class="mb-8 text-sm"><a href="/blog">Back to Blog</a></nav>
      <header class="mb-10 border-b pb-8">
        <p class="mb-3 text-sm font-semibold">Series</p>
        <h1 class="text-3xl font-bold md:text-4xl">${htmlEscape(series.name)}</h1>
        <p class="mt-3 text-muted-foreground">${series.posts.length} ordered ${series.posts.length === 1 ? 'article' : 'articles'}.</p>
      </header>
      <ol class="space-y-4">${articles}</ol>
    </main>
  </div>`;
}

export function renderSeriesHtml(shell, series) {
  const canonicalUrl = `https://techwithdikshant.com/series/${series.slug}`;
  const title = `${series.name} Series | Tech With Dikshant`;
  const description = `Read ${series.posts.length} ordered ${series.posts.length === 1 ? 'article' : 'articles'} in the ${series.name} technical series.`;
  let html = shell.replace(/<title>[^<]*<\/title>/i, `<title>${htmlEscape(title)}</title>`);
  html = replaceOrInsertMeta(html, 'name=description', description);
  html = replaceOrInsertMeta(html, 'name=author', 'Dikshant Sharma');
  html = replaceOrInsertMeta(html, 'property=og:title', title);
  html = replaceOrInsertMeta(html, 'property=og:description', description);
  html = replaceOrInsertMeta(html, 'property=og:type', 'website');
  html = replaceOrInsertMeta(html, 'property=og:url', canonicalUrl);
  html = replaceOrInsertMeta(html, 'name=twitter:title', title);
  html = replaceOrInsertMeta(html, 'name=twitter:description', description);
  html = replaceCanonical(html, canonicalUrl);
  html = injectStructuredData(html, {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: series.name,
    description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: series.posts.length,
      itemListElement: series.posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: post.canonicalUrl,
        name: post.title
      }))
    }
  }, 'series');
  return html.replace('<div id="root"></div>', renderStaticSeries(series));
}

function renderStaticBlogListing(posts) {
  const series = collectSeries(posts);
  const seriesMarkup = series.length > 0
    ? `<section aria-labelledby="series-heading" class="mb-10 border-y py-6">
        <h2 id="series-heading" class="mb-4 text-xl font-semibold">Series</h2>
        <ul class="grid grid-cols-1 gap-3 md:grid-cols-2">${series.map(item => `
          <li><a href="/series/${encodeURIComponent(item.slug)}" class="flex justify-between rounded-md border p-4"><span>${htmlEscape(item.name)}</span><span>${item.posts.length} ${item.posts.length === 1 ? 'part' : 'parts'}</span></a></li>`).join('')}
        </ul>
      </section>`
    : '';
  const articles = posts.map(post => `
    <article class="rounded-lg border bg-card p-5">
      <p class="mb-2 text-sm text-muted-foreground"><time datetime="${htmlEscape(post.date)}">${htmlEscape(post.date)}</time> · ${htmlEscape(post.readTime)}</p>
      <h2 class="mb-2 text-xl font-semibold"><a href="/blog/${encodeURIComponent(post.id)}">${htmlEscape(post.title)}</a></h2>
      <p class="mb-4 text-muted-foreground">${htmlEscape(post.excerpt)}</p>
      <div class="flex flex-wrap gap-2">${post.tags.map(tag => `<span class="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold">${htmlEscape(tag)}</span>`).join('')}</div>
    </article>`).join('');

  return `<div id="root">
    <main data-prerendered="blog-listing" class="container mx-auto px-4 py-12">
      <header class="mx-auto mb-12 max-w-3xl text-center">
        <h1 class="mb-4 text-4xl font-bold md:text-5xl">DevOps Blog</h1>
        <p class="text-xl text-muted-foreground">Cloud implementation logs, CI/CD notes, and hands-on technical tutorials organized by tags.</p>
      </header>
      ${seriesMarkup}
      <section aria-label="Latest articles" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">${articles}</section>
    </main>
  </div>`;
}

export function renderBlogIndexHtml(shell, posts) {
  const title = 'DevOps Blog - Tutorials & Best Practices | Tech With Dikshant';
  const description = 'Explore practical DevOps tutorials covering Docker, Kubernetes, CI/CD, cloud platforms, networking, security, and automation.';
  const canonicalUrl = 'https://techwithdikshant.com/blog';

  let html = shell.replace(/<title>[^<]*<\/title>/i, `<title>${htmlEscape(title)}</title>`);
  html = replaceOrInsertMeta(html, 'name=description', description);
  html = replaceOrInsertMeta(html, 'name=keywords', 'DevOps blog, Docker tutorials, Kubernetes guide, CI/CD pipeline, cloud computing, automation');
  html = replaceOrInsertMeta(html, 'name=author', 'Dikshant Sharma');
  html = replaceOrInsertMeta(html, 'property=og:title', title);
  html = replaceOrInsertMeta(html, 'property=og:description', description);
  html = replaceOrInsertMeta(html, 'property=og:type', 'website');
  html = replaceOrInsertMeta(html, 'property=og:url', canonicalUrl);
  html = replaceOrInsertMeta(html, 'name=twitter:title', title);
  html = replaceOrInsertMeta(html, 'name=twitter:description', description);
  html = replaceCanonical(html, canonicalUrl);
  html = injectStructuredData(html, {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'DevOps Blog',
    description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: posts.length,
      itemListElement: posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: post.canonicalUrl,
        name: post.title
      }))
    }
  }, 'blog-listing');
  return html.replace('<div id="root"></div>', renderStaticBlogListing(posts));
}

const STATIC_PAGES = [
  {
    route: '/',
    title: 'Tech With Dikshant - DevOps Tutorials & Insights',
    description: 'Master DevOps with practical tutorials on Docker, Kubernetes, CI/CD, cloud platforms, networking, security, and automation.',
    heading: 'Master DevOps with Dikshant',
    body: 'Independent implementation logs and hands-on technical guides grounded in real engineering work.'
  },
  {
    route: '/about',
    title: 'About Dikshant Sharma | DevOps Engineer and Educator',
    description: "Learn about Dikshant Sharma's DevOps and cloud engineering background, technical focus, and practical teaching approach.",
    heading: 'About Dikshant Sharma',
    body: 'DevOps engineer, cloud architect, and technical educator focused on making complex infrastructure concepts practical and understandable.'
  },
  {
    route: '/newsletter',
    title: 'DevOps Newsletter | Tech With Dikshant',
    description: 'Subscribe for practical DevOps tutorials, cloud engineering notes, CI/CD guidance, and new technical articles.',
    heading: 'DevOps Newsletter',
    body: 'Receive new technical tutorials, implementation notes, and cloud engineering updates.'
  },
  {
    route: '/connect',
    title: 'Contact Dikshant Sharma | Tech With Dikshant',
    description: 'Contact Dikshant Sharma about DevOps, cloud engineering, technical collaboration, or questions about published tutorials.',
    heading: 'Contact Dikshant Sharma',
    body: 'Get in touch about DevOps, cloud engineering, technical collaboration, or a published tutorial.'
  }
];

function renderStaticPageRoot(page, posts) {
  const featured = page.route === '/'
    ? `<section aria-labelledby="latest-heading" class="mt-12">
        <h2 id="latest-heading" class="mb-5 text-2xl font-semibold">Latest DevOps Articles</h2>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">${posts.slice(0, 3).map(post => `
          <article class="rounded-lg border p-5">
            <h3 class="mb-2 text-lg font-semibold"><a href="/blog/${encodeURIComponent(post.id)}">${htmlEscape(post.title)}</a></h3>
            <p class="text-muted-foreground">${htmlEscape(post.excerpt)}</p>
          </article>`).join('')}
        </div>
        <p class="mt-6"><a href="/blog" class="font-semibold">Explore all articles</a></p>
      </section>`
    : `<p class="mt-8"><a href="/blog" class="font-semibold">Explore the DevOps blog</a></p>`;

  return `<div id="root">
    <main data-prerendered="static-page" class="container mx-auto max-w-5xl px-4 py-16">
      <header class="max-w-3xl">
        <h1 class="mb-5 text-4xl font-bold md:text-5xl">${htmlEscape(page.heading)}</h1>
        <p class="text-xl text-muted-foreground">${htmlEscape(page.body)}</p>
      </header>
      ${featured}
    </main>
  </div>`;
}

export function renderStaticPageHtml(shell, page, posts = []) {
  const canonicalUrl = `https://techwithdikshant.com${page.route === '/' ? '' : page.route}`;
  let html = shell.replace(/<title>[^<]*<\/title>/i, `<title>${htmlEscape(page.title)}</title>`);
  html = replaceOrInsertMeta(html, 'name=description', page.description);
  html = replaceOrInsertMeta(html, 'name=author', 'Dikshant Sharma');
  html = replaceOrInsertMeta(html, 'property=og:title', page.title);
  html = replaceOrInsertMeta(html, 'property=og:description', page.description);
  html = replaceOrInsertMeta(html, 'property=og:type', page.route === '/about' ? 'profile' : 'website');
  html = replaceOrInsertMeta(html, 'property=og:url', canonicalUrl);
  html = replaceOrInsertMeta(html, 'name=twitter:title', page.title);
  html = replaceOrInsertMeta(html, 'name=twitter:description', page.description);
  html = replaceCanonical(html, canonicalUrl);
  html = injectStructuredData(html, {
    '@context': 'https://schema.org',
    '@type': page.route === '/about' ? 'ProfilePage' : 'WebPage',
    name: page.heading,
    description: page.description,
    url: canonicalUrl
  }, 'webpage');
  return html.replace('<div id="root"></div>', renderStaticPageRoot(page, posts));
}

export function renderNotFoundHtml(shell) {
  let html = shell.replace(/<title>[^<]*<\/title>/i, '<title>Page Not Found | Tech With Dikshant</title>');
  html = replaceOrInsertMeta(html, 'name=description', 'The requested page could not be found.');
  html = replaceOrInsertMeta(html, 'name=robots', 'noindex, nofollow');
  html = replaceOrInsertMeta(html, 'property=og:title', 'Page Not Found | Tech With Dikshant');
  html = html.replace(
    '<div id="root"></div>',
    `<div id="root"><main data-prerendered="not-found" class="container mx-auto px-4 py-20 text-center"><h1 class="mb-4 text-4xl font-bold">404</h1><p class="mb-6 text-xl text-muted-foreground">Page not found</p><a href="/" class="font-semibold">Return to Home</a></main></div>`
  );
  return html;
}

async function writePrettyRoute(route, html) {
  const routeName = route.replace(/^\//, '');
  const routeDir = join(DIST_DIR, routeName);
  await mkdir(routeDir, { recursive: true });
  await Promise.all([
    writeFile(join(routeDir, 'index.html'), html),
    writeFile(join(DIST_DIR, `${routeName}.html`), html)
  ]);
}

async function main() {
  const [shell, postsJson] = await Promise.all([
    readFile(INDEX_HTML, 'utf-8'),
    readFile(POSTS_INDEX, 'utf-8')
  ]);
  const posts = JSON.parse(postsJson);
  const blogDir = join(DIST_DIR, 'blog');
  await mkdir(blogDir, { recursive: true });

  for (const post of posts) {
    const [rawMarkdown, detailsJson] = await Promise.all([
      readFile(join(BLOG_POSTS_DIR, post.fileName), 'utf-8'),
      readFile(join(BLOG_POST_DETAILS_DIR, `${post.id}.json`), 'utf-8')
    ]);
    const fullPost = { ...post, ...JSON.parse(detailsJson) };
    const markdown = matter(rawMarkdown).content.trim();
    const articleHtml = renderArticleHtml(shell, fullPost, markdown);
    const routeDir = join(DIST_DIR, 'blog', post.slug);
    await mkdir(routeDir, { recursive: true });
    await Promise.all([
      writeFile(join(routeDir, 'index.html'), articleHtml),
      writeFile(join(blogDir, `${post.slug}.html`), articleHtml)
    ]);
  }

  const blogIndexHtml = renderBlogIndexHtml(shell, posts);
  await Promise.all([
    writeFile(join(blogDir, 'index.html'), blogIndexHtml),
    writeFile(join(DIST_DIR, 'blog.html'), blogIndexHtml)
  ]);

  const seriesDir = join(DIST_DIR, 'series');
  const seriesCollections = collectSeries(posts);
  if (seriesCollections.length > 0) await mkdir(seriesDir, { recursive: true });
  for (const series of seriesCollections) {
    const seriesHtml = renderSeriesHtml(shell, series);
    const routeDir = join(seriesDir, series.slug);
    await mkdir(routeDir, { recursive: true });
    await Promise.all([
      writeFile(join(routeDir, 'index.html'), seriesHtml),
      writeFile(join(seriesDir, `${series.slug}.html`), seriesHtml)
    ]);
  }

  for (const page of STATIC_PAGES) {
    const pageHtml = renderStaticPageHtml(shell, page, posts);
    if (page.route === '/') {
      await writeFile(INDEX_HTML, pageHtml);
    } else {
      await writePrettyRoute(page.route, pageHtml);
    }
  }
  await writeFile(join(DIST_DIR, '404.html'), renderNotFoundHtml(shell));
  console.log(`Prerendered ${posts.length} blog articles and ${seriesCollections.length} series.`);
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirectExecution) {
  main().catch(error => {
    console.error('Failed to prerender blog pages:', error);
    process.exit(1);
  });
}
