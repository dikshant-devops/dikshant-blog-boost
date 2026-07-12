import { useEffect, useMemo } from 'react';

interface SEOData {
  title: string;
  description: string;
  keywords?: string;
  author?: string;
  image?: string;
  url?: string;
  type?: string;
  publishedTime?: string;
  modifiedTime?: string;
  tags?: string[];
  robots?: string;
}

const ARTICLE_META_PROPERTIES = [
  'article:published_time',
  'article:modified_time',
  'article:author',
  'article:tag',
];

function upsertStructuredData(key: string, data: object) {
  const selector = `script[data-structured-data="${key}"]`;
  const scripts = Array.from(document.querySelectorAll('script[data-structured-data]'));
  const existing = scripts.find(script => script.matches(selector));
  scripts.filter(script => script !== existing).forEach(script => script.remove());

  const script = existing || document.createElement('script');
  script.type = 'application/ld+json';
  script.setAttribute('data-structured-data', key);
  script.textContent = JSON.stringify(data);
  if (!existing) document.head.appendChild(script);
}

type ArticleStructuredData = {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  tags?: string[];
  readTime?: string;
  url?: string;
};

type CollectionStructuredData = {
  name: string;
  description: string;
  url: string;
  items: Array<{ name: string; url: string }>;
};

export const useSEO = (data: SEOData | null) => {
  const imageUrl = useMemo(() => {
    if (!data) return '';
    const image = data.image || '/og-default.jpg';
    return image.startsWith('http') ? image : `${window.location.origin}${image}`;
  }, [data]);

  // Memoize meta tags array to prevent recreation on every render
  const metaTags = useMemo(() => [
    ...(data ? [
    { name: 'description', content: data.description },
    { name: 'keywords', content: data.keywords || '' },
    { name: 'author', content: data.author || 'Dikshant Rai' },
    { name: 'robots', content: data.robots || 'index, follow' },

    // Open Graph
    { property: 'og:title', content: data.title },
    { property: 'og:description', content: data.description },
    { property: 'og:type', content: data.type || 'article' },
    { property: 'og:url', content: data.url || window.location.href },
    { property: 'og:image', content: imageUrl },
    { property: 'og:image:width', content: '1200' },
    { property: 'og:image:height', content: '630' },
    { property: 'og:site_name', content: 'Tech With Dikshant' },

    // Twitter Cards
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@techwithdikshant' },
    { name: 'twitter:title', content: data.title },
    { name: 'twitter:description', content: data.description },
    { name: 'twitter:image', content: imageUrl },

    // Article specific
    ...(data.publishedTime ? [{ property: 'article:published_time', content: data.publishedTime }] : []),
    ...(data.modifiedTime ? [{ property: 'article:modified_time', content: data.modifiedTime }] : []),
    ...(data.author ? [{ property: 'article:author', content: data.author }] : []),
    ...(data.tags ? data.tags.map(tag => ({ property: 'article:tag', content: tag })) : []),
    ] : []),
  ], [data, imageUrl]);

  const pageStructuredData = useMemo(() => {
    if (!data || data.type === 'article') return null;
    const isProfile = data.type === 'profile';
    const url = data.url || window.location.href;
    return {
      '@context': 'https://schema.org',
      '@type': isProfile ? 'ProfilePage' : 'WebPage',
      name: data.title,
      description: data.description,
      url,
      ...(isProfile && {
        mainEntity: {
          '@type': 'Person',
          name: 'Dikshant Rai',
          jobTitle: 'Sr Site Reliability Engineer',
          image: imageUrl,
          url,
        },
      }),
    };
  }, [data, imageUrl]);

  useEffect(() => {
    if (!data) return;

    // Update document title
    document.title = data.title;

    ARTICLE_META_PROPERTIES.forEach(property => {
      document.querySelectorAll(`meta[property="${property}"]`).forEach(meta => meta.remove());
    });

    metaTags.forEach(tag => {
      const attribute = 'name' in tag ? 'name' : 'property';
      const key = 'name' in tag ? tag.name : tag.property;

      if (key === 'article:tag') {
        const meta = document.createElement('meta');
        meta.setAttribute('property', key);
        meta.setAttribute('content', tag.content);
        meta.setAttribute('data-seo', 'true');
        document.head.appendChild(meta);
        return;
      }

      const matches = Array.from(document.querySelectorAll(`meta[${attribute}="${key}"]`));
      const [existing, ...duplicates] = matches;
      duplicates.forEach(meta => meta.remove());

      if (!tag.content) {
        existing?.remove();
        return;
      }

      const meta = existing || document.createElement('meta');
      meta.setAttribute(attribute, key);
      meta.setAttribute('content', tag.content);
      meta.setAttribute('data-seo', 'true');
      if (!existing) document.head.appendChild(meta);
    });

    // Add canonical URL
    const canonicals = Array.from(document.querySelectorAll('link[rel="canonical"]')) as HTMLLinkElement[];
    let canonical = canonicals.shift();
    canonicals.forEach(link => link.remove());
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = data.url || window.location.href;

    if (pageStructuredData) upsertStructuredData('webpage', pageStructuredData);
  }, [data, metaTags, pageStructuredData]);
};

export const useArticleStructuredData = (data: ArticleStructuredData | null) => {
  const imageUrl = useMemo(() => {
    if (!data) return '';
    const image = data.image || '/og-default.jpg';
    return image.startsWith('http') ? image : `${window.location.origin}${image}`;
  }, [data]);

  // Memoize structured data to prevent recalculation on every render
  const structuredData = useMemo(() => data ? ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": data.title,
    "description": data.description,
    "image": imageUrl,
    "author": {
      "@type": "Person",
      "name": data.author,
      "jobTitle": "Sr Site Reliability Engineer",
      "url": "https://techwithdikshant.com/about"
    },
    "publisher": {
      "@type": "Organization",
      "name": "Tech With Dikshant",
      "logo": {
        "@type": "ImageObject",
        "url": "https://techwithdikshant.com/logo.svg"
      }
    },
    "datePublished": data.datePublished,
    "dateModified": data.dateModified || data.datePublished,
    "mainEntityOfPage": {
      "@type": "WebPage",
      "@id": data.url || window.location.href
    },
    "keywords": data.tags?.join(', ') || '',
    ...(data.readTime && {
      "timeRequired": data.readTime
    })
  }) : null, [data, imageUrl]);

  useEffect(() => {
    if (!structuredData) return;

    upsertStructuredData('article', structuredData);
  }, [structuredData]);
};

export const useCollectionStructuredData = (data: CollectionStructuredData | null, key: string) => {
  const structuredData = useMemo(() => data ? ({
    "@context": "https://schema.org",
    "@type": "CollectionPage",
    "name": data.name,
    "description": data.description,
    "url": data.url,
    "mainEntity": {
      "@type": "ItemList",
      "numberOfItems": data.items.length,
      "itemListElement": data.items.map((item, index) => ({
        "@type": "ListItem",
        "position": index + 1,
        "url": item.url,
        "name": item.name,
      }))
    }
  }) : null, [data]);

  useEffect(() => {
    if (!structuredData) return;

    upsertStructuredData(key, structuredData);
  }, [key, structuredData]);
};
