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
  const playlistMarkup = post.playlist && post.playlistSlug
    ? `<p class="mt-3"><a href="/playlists/${encodeURIComponent(post.playlistSlug)}">${htmlEscape(post.playlist)}${post.playlistOrder ? ` · Item ${post.playlistOrder}` : ''}</a></p>`
    : '';

  return `<div id="root">
    <main data-prerendered="article" class="container mx-auto max-w-6xl px-4 py-12">
      <nav aria-label="Breadcrumb" class="mb-8 text-sm"><a href="/blog">Back to Blog</a></nav>
      <article>
        <header class="mb-10 max-w-4xl border-b pb-10">
          <p class="mb-4 text-xs font-semibold uppercase text-primary">${htmlEscape(post.category)}</p>
          <div class="mb-5 flex flex-wrap gap-2">${tags}</div>
          <h1 class="text-3xl font-bold leading-tight md:text-5xl">${htmlEscape(post.title)}</h1>
          <p class="mt-5 max-w-3xl text-lg text-muted-foreground">${htmlEscape(post.excerpt)}</p>
          <p class="mt-6 text-sm text-muted-foreground">${htmlEscape(post.author)} · <time datetime="${htmlEscape(post.date)}">${formattedDate}</time> · ${htmlEscape(post.readTime)}</p>
          ${playlistMarkup}
        </header>
        <div class="prose prose-lg max-w-3xl dark:prose-invert">${renderedMarkdown}</div>
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
      jobTitle: 'Sr Site Reliability Engineer',
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

function collectPlaylists(posts) {
  const collections = new Map();
  for (const post of posts) {
    if (!post.playlist || !post.playlistSlug) continue;
    const existing = collections.get(post.playlistSlug) || {
      name: post.playlist,
      slug: post.playlistSlug,
      platform: post.platform,
      posts: []
    };
    existing.posts.push(post);
    collections.set(post.playlistSlug, existing);
  }

  return Array.from(collections.values())
    .map(playlist => ({
      ...playlist,
      posts: playlist.posts.sort((a, b) =>
        (a.playlistOrder ?? Number.MAX_SAFE_INTEGER) - (b.playlistOrder ?? Number.MAX_SAFE_INTEGER)
        || new Date(a.date).getTime() - new Date(b.date).getTime()
      )
    }))
    .sort((a, b) => a.name.localeCompare(b.name));
}

function renderStaticPlaylist(playlist) {
  const articles = playlist.posts.map((post, index) => `
    <li>
      <a href="/blog/${encodeURIComponent(post.id)}" class="block rounded-md border p-5">
        <p class="mb-2 text-sm font-semibold">Item ${post.playlistOrder ?? index + 1}</p>
        <h2 class="mb-2 text-xl font-semibold">${htmlEscape(post.title)}</h2>
        <p class="text-muted-foreground">${htmlEscape(post.excerpt)}</p>
      </a>
    </li>`).join('');

  return `<div id="root">
    <main data-prerendered="playlist" class="container mx-auto max-w-4xl px-4 py-10">
      <nav aria-label="Breadcrumb" class="mb-8 text-sm"><a href="/blog">Back to Blog</a></nav>
      <header class="mb-10 border-b pb-8">
        <p class="mb-3 text-sm font-semibold">Playlist · ${htmlEscape(playlist.platform)}</p>
        <h1 class="text-3xl font-bold md:text-4xl">${htmlEscape(playlist.name)}</h1>
        <p class="mt-3 text-muted-foreground">${playlist.posts.length} ordered ${playlist.posts.length === 1 ? 'article' : 'articles'}. Every article remains independently searchable.</p>
      </header>
      <ol class="space-y-4">${articles}</ol>
    </main>
  </div>`;
}

export function renderPlaylistHtml(shell, playlist) {
  const canonicalUrl = `https://techwithdikshant.com/playlists/${playlist.slug}`;
  const title = `${playlist.name} Playlist | Tech With Dikshant`;
  const description = `Browse ${playlist.posts.length} ordered ${playlist.posts.length === 1 ? 'article' : 'articles'} in the ${playlist.name} ${playlist.platform} playlist.`;
  let html = shell.replace(/<title>[^<]*<\/title>/i, `<title>${htmlEscape(title)}</title>`);
  html = replaceOrInsertMeta(html, 'name=description', description);
  html = replaceOrInsertMeta(html, 'name=author', 'Dikshant Rai');
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
    name: playlist.name,
    description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: playlist.posts.length,
      itemListElement: playlist.posts.map((post, index) => ({
        '@type': 'ListItem',
        position: index + 1,
        url: post.canonicalUrl,
        name: post.title
      }))
    }
  }, 'playlist');
  return html.replace('<div id="root"></div>', renderStaticPlaylist(playlist));
}

function renderStaticBlogListing(posts) {
  const playlists = collectPlaylists(posts);
  const listingPosts = posts.filter(post => !post.playlistOnly);
  const playlistMarkup = playlists.length > 0
    ? `<section aria-labelledby="playlists-heading" class="mb-10 border-y py-6">
        <h2 id="playlists-heading" class="mb-4 text-xl font-semibold">Playlists</h2>
        <p class="mb-4 text-sm text-muted-foreground">Optional ordered collections. Playlist-only lessons stay out of the main feed but remain independently searchable.</p>
        <ul class="grid grid-cols-1 gap-3 md:grid-cols-2">${playlists.map(item => `
          <li><a href="/playlists/${encodeURIComponent(item.slug)}" class="flex justify-between rounded-md border p-4"><span>${htmlEscape(item.name)}</span><span>${item.posts.length} ${item.posts.length === 1 ? 'article' : 'articles'}</span></a></li>`).join('')}
        </ul>
      </section>`
    : '';
  const articles = listingPosts.map(post => `
    <article class="rounded-md border bg-card p-6">
      <p class="mb-2 text-sm text-muted-foreground"><time datetime="${htmlEscape(post.date)}">${htmlEscape(post.date)}</time> · ${htmlEscape(post.readTime)}</p>
      <h2 class="mb-2 text-xl font-semibold"><a href="/blog/${encodeURIComponent(post.id)}">${htmlEscape(post.title)}</a></h2>
      <p class="mb-4 text-muted-foreground">${htmlEscape(post.excerpt)}</p>
      <div class="flex flex-wrap gap-2">${post.tags.map(tag => `<span class="inline-flex rounded-full border px-2.5 py-0.5 text-xs font-semibold">${htmlEscape(tag)}</span>`).join('')}</div>
    </article>`).join('');

  return `<div id="root">
    <main data-prerendered="blog-listing" class="container mx-auto px-4 py-14">
      <header class="mb-10 max-w-3xl border-b pb-8">
        <p class="mb-2 text-xs font-semibold uppercase text-primary">Implementation library</p>
        <h1 class="text-4xl font-bold md:text-5xl">DevOps field notes</h1>
        <p class="mt-4 text-lg text-muted-foreground">Cloud infrastructure, delivery pipelines, networking, and container operations explained through practical engineering work.</p>
        <p class="mt-3 text-sm text-muted-foreground">${posts.length} searchable ${posts.length === 1 ? 'article' : 'articles'} · ${listingPosts.length} in main feed</p>
      </header>
      ${playlistMarkup}
      <section aria-label="Latest articles" class="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">${articles}</section>
    </main>
  </div>`;
}

export function renderBlogIndexHtml(shell, posts) {
  const title = 'DevOps Field Notes | Tech With Dikshant';
  const description = 'Practical field notes on GCP, AWS, Kubernetes, Docker, GitHub Actions, networking, and reliability, with commands, tradeoffs, and verification steps.';
  const canonicalUrl = 'https://techwithdikshant.com/blog';

  let html = shell.replace(/<title>[^<]*<\/title>/i, `<title>${htmlEscape(title)}</title>`);
  html = replaceOrInsertMeta(html, 'name=description', description);
  html = replaceOrInsertMeta(html, 'name=keywords', 'DevOps blog, Docker tutorials, Kubernetes guide, CI/CD pipeline, cloud computing, automation');
  html = replaceOrInsertMeta(html, 'name=author', 'Dikshant Rai');
  html = replaceOrInsertMeta(html, 'property=og:title', title);
  html = replaceOrInsertMeta(html, 'property=og:description', description);
  html = replaceOrInsertMeta(html, 'property=og:type', 'website');
  html = replaceOrInsertMeta(html, 'property=og:url', canonicalUrl);
  html = replaceOrInsertMeta(html, 'name=twitter:title', title);
  html = replaceOrInsertMeta(html, 'name=twitter:description', description);
  html = replaceCanonical(html, canonicalUrl);
  const listingPosts = posts.filter(post => !post.playlistOnly);
  html = injectStructuredData(html, {
    '@context': 'https://schema.org',
    '@type': 'CollectionPage',
    name: 'DevOps Blog',
    description,
    url: canonicalUrl,
    mainEntity: {
      '@type': 'ItemList',
      numberOfItems: listingPosts.length,
      itemListElement: listingPosts.map((post, index) => ({
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
    title: 'Tech With Dikshant | Practical DevOps Field Notes',
    description: 'Practical DevOps field notes on cloud infrastructure, CI/CD, networking, containers, and reliability, with tested commands and operational context.',
    heading: 'Tech With Dikshant',
    body: 'Practical cloud, CI/CD, networking, and container guides built around the decisions engineers make in real systems.'
  },
  {
    route: '/about',
    title: 'About Dikshant Rai | Sr Site Reliability Engineer',
    description: "Learn about Dikshant Rai's work as a Sr Site Reliability Engineer, technical focus, and practical writing approach.",
    heading: 'Dikshant Rai',
    body: 'Sr Site Reliability Engineer documenting the implementation details, tradeoffs, and operational context behind reliable modern infrastructure.'
  },
  {
    route: '/newsletter',
    title: 'DevOps Newsletter | Tech With Dikshant',
    description: 'Subscribe for practical DevOps tutorials, cloud engineering notes, CI/CD guidance, and new technical articles.',
    heading: 'The useful part of the week, in one email',
    body: 'New DevOps field notes, implementation lessons, and operational context, sent when there is something worth reading.'
  },
  {
    route: '/connect',
    title: 'Contact Dikshant Rai | Sr Site Reliability Engineer',
    description: 'Contact Dikshant Rai about site reliability engineering, cloud infrastructure, technical collaboration, or published tutorials.',
    heading: 'Start a useful conversation',
    body: 'Ask about a published guide, discuss a DevOps problem, or propose a technical collaboration.'
  },
  {
    route: '/privacy',
    title: 'Privacy Policy | Tech With Dikshant',
    description: 'How Tech With Dikshant handles newsletter subscriptions, contact messages, security data, and local preferences.',
    heading: 'Privacy policy',
    body: 'Newsletter, contact, security, and browser-preference data used by this website.',
    sections: [
      ['Information you provide', 'Newsletter addresses are processed by Beehiiv. Contact names, addresses, subjects, and messages are stored in SheetDB for review and response.'],
      ['Security data', 'Cloudflare hosts the site and provides Turnstile verification and request rate limiting. Contact records include the connecting IP address and browser user-agent string.'],
      ['Your choices', 'Every newsletter includes an unsubscribe option. Data access or deletion requests can be sent to dikshantdevops@gmail.com.']
    ]
  },
  {
    route: '/terms',
    title: 'Terms of Use | Tech With Dikshant',
    description: 'Terms for using Tech With Dikshant articles, code examples, external links, and website services.',
    heading: 'Terms of use',
    body: 'Expectations for technical examples, original content, external services, and acceptable use.',
    sections: [
      ['Technical information', 'Examples are educational. Review current vendor documentation and test commands outside production before applying them to your environment.'],
      ['Content and availability', 'Original articles may be linked and briefly quoted with attribution. Content can be corrected, moved, or removed as platforms change.'],
      ['Acceptable use', 'Do not abuse form endpoints, bypass security controls, interfere with operation, or submit unlawful or confidential third-party material.']
    ]
  }
];

const STATIC_FOCUS_TRACKS = [
  {
    title: 'GCP security',
    tag: 'GCP',
    matches: post => post.tags.includes('GCP') && post.tags.includes('Security')
  },
  {
    title: 'Delivery automation',
    tag: 'CI/CD',
    matches: post => post.tags.includes('CI/CD')
  },
  {
    title: 'Container operations',
    tag: 'Containers',
    matches: post => post.tags.includes('Containers')
  }
];

function renderStaticFocusTracks(posts) {
  return `<section aria-labelledby="focus-tracks-heading" class="border-y bg-card">
    <div class="container mx-auto max-w-6xl px-4 py-14">
      <p class="mb-2 text-xs font-semibold uppercase text-primary">Explore by focus</p>
      <h2 id="focus-tracks-heading" class="mb-8 text-3xl font-semibold">Build depth in one area</h2>
      <div class="grid grid-cols-1 gap-4 md:grid-cols-3">${STATIC_FOCUS_TRACKS.map(track => {
        const matchingPosts = posts.filter(track.matches);
        return `<article class="rounded-md border bg-background p-5">
          <h3 class="text-xl font-semibold">${htmlEscape(track.title)}</h3>
          <p class="mt-2 text-sm">${matchingPosts.length} ${matchingPosts.length === 1 ? 'field note' : 'field notes'}</p>
          <ul class="mt-4">${matchingPosts.slice(0, 2).map(post => `<li><a href="/blog/${encodeURIComponent(post.id)}">${htmlEscape(post.title)}</a></li>`).join('')}</ul>
          <p class="mt-5"><a href="/blog?tag=${encodeURIComponent(track.tag)}">Explore ${htmlEscape(track.title)}</a></p>
        </article>`;
      }).join('')}</div>
    </div>
  </section>`;
}

function renderStaticPageRoot(page, posts) {
  if (page.route === '/') {
    const listingPosts = posts.filter(post => !post.playlistOnly);
    return `<div id="root">
      <main data-prerendered="static-page">
        <section class="relative flex min-h-[500px] items-center overflow-hidden bg-black text-white">
          <img src="/images/site/devops-operations-hero.jpg" srcset="/images/site/devops-operations-hero-960.jpg 960w, /images/site/devops-operations-hero-1440.jpg 1440w, /images/site/devops-operations-hero.jpg 1920w" sizes="100vw" alt="Cloud infrastructure operations workspace" width="1920" height="1053" loading="eager" fetchpriority="high" decoding="async" class="absolute inset-0 h-full w-full object-cover" />
          <div class="absolute inset-0 bg-black/60"></div>
          <header class="container relative mx-auto max-w-6xl px-4">
            <p class="mb-5 text-xs font-semibold uppercase text-cyan-300">Production-minded DevOps notes</p>
            <h1 class="text-4xl font-bold md:text-6xl">${htmlEscape(page.heading)}</h1>
            <p class="mt-6 max-w-xl text-xl text-white/80">${htmlEscape(page.body)}</p>
            <p class="mt-8"><a href="/blog" class="font-semibold text-cyan-300">Read the field notes</a></p>
          </header>
        </section>
        <section aria-labelledby="latest-heading" class="container mx-auto max-w-6xl px-4 py-16">
        <p class="mb-2 text-xs font-semibold uppercase text-primary">Recently published</p>
        <h2 id="latest-heading" class="mb-8 text-3xl font-semibold">Latest field notes</h2>
        <div class="grid grid-cols-1 gap-5 md:grid-cols-3">${listingPosts.slice(0, 3).map(post => `
          <article class="rounded-md border bg-card p-5">
            <h3 class="mb-2 text-lg font-semibold"><a href="/blog/${encodeURIComponent(post.id)}">${htmlEscape(post.title)}</a></h3>
            <p class="text-muted-foreground">${htmlEscape(post.excerpt)}</p>
          </article>`).join('')}
        </div>
        <p class="mt-6"><a href="/blog" class="font-semibold">Explore all articles</a></p>
      </section>
      ${renderStaticFocusTracks(listingPosts)}
      </main>
    </div>`;
  }

  if (page.route === '/about') {
    return `<div id="root">
      <main data-prerendered="static-page" class="container mx-auto max-w-6xl px-4 py-16">
        <header class="grid gap-10 border-b pb-12 md:grid-cols-[minmax(0,1fr)_20rem] md:items-center">
          <div class="max-w-3xl">
            <p class="mb-3 text-xs font-semibold uppercase text-primary">Sr Site Reliability Engineer</p>
            <h1 class="mb-5 text-4xl font-bold md:text-6xl">${htmlEscape(page.heading)}</h1>
            <p class="text-xl text-muted-foreground">${htmlEscape(page.body)}</p>
            <p class="mt-8"><a href="/blog" class="font-semibold">Explore the DevOps field notes</a></p>
          </div>
          <figure>
            <img src="/images/about/dikshant-rai.jpg" alt="Dikshant Rai, Sr Site Reliability Engineer" width="868" height="1085" fetchpriority="high" class="aspect-[4/5] w-full rounded-md border object-cover" />
            <figcaption class="mt-3 text-xs text-muted-foreground">Engineering reliable cloud systems and documenting the decisions behind them.</figcaption>
          </figure>
        </header>
      </main>
    </div>`;
  }

  if (page.sections) {
    return `<div id="root">
      <main data-prerendered="static-page" class="container mx-auto max-w-4xl px-4 py-16">
        <header class="border-b pb-8"><h1 class="text-4xl font-bold md:text-5xl">${htmlEscape(page.heading)}</h1><p class="mt-4 text-muted-foreground">${htmlEscape(page.body)}</p></header>
        <div class="mt-10">${page.sections.map(([heading, body]) => `<section class="mb-8"><h2 class="text-2xl font-semibold">${htmlEscape(heading)}</h2><p class="mt-3">${htmlEscape(body)}</p></section>`).join('')}</div>
      </main>
    </div>`;
  }

  return `<div id="root">
    <main data-prerendered="static-page" class="container mx-auto max-w-5xl px-4 py-16">
      <header class="max-w-3xl">
        <p class="mb-3 text-xs font-semibold uppercase text-primary">Tech With Dikshant</p>
        <h1 class="mb-5 text-4xl font-bold md:text-5xl">${htmlEscape(page.heading)}</h1>
        <p class="text-xl text-muted-foreground">${htmlEscape(page.body)}</p>
      </header>
      <p class="mt-8"><a href="/blog" class="font-semibold">Explore the DevOps field notes</a></p>
    </main>
  </div>`;
}

export function renderStaticPageHtml(shell, page, posts = []) {
  const canonicalUrl = `https://techwithdikshant.com${page.route === '/' ? '' : page.route}`;
  let html = shell.replace(/<title>[^<]*<\/title>/i, `<title>${htmlEscape(page.title)}</title>`);
  html = replaceOrInsertMeta(html, 'name=description', page.description);
  html = replaceOrInsertMeta(html, 'name=author', 'Dikshant Rai');
  html = replaceOrInsertMeta(html, 'property=og:title', page.title);
  html = replaceOrInsertMeta(html, 'property=og:description', page.description);
  html = replaceOrInsertMeta(html, 'property=og:type', page.route === '/about' ? 'profile' : 'website');
  html = replaceOrInsertMeta(html, 'property=og:url', canonicalUrl);
  html = replaceOrInsertMeta(html, 'name=twitter:title', page.title);
  html = replaceOrInsertMeta(html, 'name=twitter:description', page.description);
  html = replaceCanonical(html, canonicalUrl);
  const isAboutPage = page.route === '/about';
  html = injectStructuredData(html, {
    '@context': 'https://schema.org',
    '@type': isAboutPage ? 'ProfilePage' : 'WebPage',
    name: page.heading,
    description: page.description,
    url: canonicalUrl,
    ...(isAboutPage && {
      mainEntity: {
        '@type': 'Person',
        name: 'Dikshant Rai',
        jobTitle: 'Sr Site Reliability Engineer',
        image: 'https://techwithdikshant.com/images/about/dikshant-rai.jpg',
        url: canonicalUrl
      }
    })
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

  const playlistsDir = join(DIST_DIR, 'playlists');
  const playlistCollections = collectPlaylists(posts);
  if (playlistCollections.length > 0) await mkdir(playlistsDir, { recursive: true });
  for (const playlist of playlistCollections) {
    const playlistHtml = renderPlaylistHtml(shell, playlist);
    const routeDir = join(playlistsDir, playlist.slug);
    await mkdir(routeDir, { recursive: true });
    await Promise.all([
      writeFile(join(routeDir, 'index.html'), playlistHtml),
      writeFile(join(playlistsDir, `${playlist.slug}.html`), playlistHtml)
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
  console.log(`Prerendered ${posts.length} blog articles and ${playlistCollections.length} playlists.`);
}

const isDirectExecution = process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href;
if (isDirectExecution) {
  main().catch(error => {
    console.error('Failed to prerender blog pages:', error);
    process.exit(1);
  });
}
