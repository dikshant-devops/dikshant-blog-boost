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
}

export const useSEO = (data: SEOData) => {
  // Memoize meta tags array to prevent recreation on every render
  const metaTags = useMemo(() => [
    { name: 'description', content: data.description },
    { name: 'keywords', content: data.keywords || '' },
    { name: 'author', content: data.author || 'Dikshant' },

    // Open Graph
    { property: 'og:title', content: data.title },
    { property: 'og:description', content: data.description },
    { property: 'og:type', content: data.type || 'article' },
    { property: 'og:url', content: data.url || window.location.href },
    { property: 'og:image', content: data.image || '/logo.svg' },
    { property: 'og:site_name', content: 'Tech With Dikshant' },

    // Twitter Cards
    { name: 'twitter:card', content: 'summary_large_image' },
    { name: 'twitter:site', content: '@techwithdikshant' },
    { name: 'twitter:title', content: data.title },
    { name: 'twitter:description', content: data.description },
    { name: 'twitter:image', content: data.image || '/logo.svg' },

    // Article specific
    ...(data.publishedTime ? [{ property: 'article:published_time', content: data.publishedTime }] : []),
    ...(data.modifiedTime ? [{ property: 'article:modified_time', content: data.modifiedTime }] : []),
    ...(data.tags ? data.tags.map(tag => ({ property: 'article:tag', content: tag })) : []),
  ], [data.title, data.description, data.keywords, data.author, data.image, data.url, data.type, data.publishedTime, data.modifiedTime, data.tags]);

  useEffect(() => {
    // Update document title
    document.title = data.title;

    // Remove existing SEO meta tags
    const existingMetas = document.querySelectorAll('meta[data-seo="true"]');
    existingMetas.forEach(meta => meta.remove());

    // Batch DOM operations using DocumentFragment - reduces reflows
    const fragment = document.createDocumentFragment();

    // Create all meta tags and add to fragment
    metaTags.forEach(tag => {
      if (tag.content) {
        const meta = document.createElement('meta');
        if ('name' in tag) {
          meta.setAttribute('name', tag.name);
        } else if ('property' in tag) {
          meta.setAttribute('property', tag.property);
        }
        meta.setAttribute('content', tag.content);
        meta.setAttribute('data-seo', 'true');
        fragment.appendChild(meta);
      }
    });

    // Single DOM insertion - much faster than multiple appendChild calls
    document.head.appendChild(fragment);

    // Add canonical URL
    let canonical = document.querySelector('link[rel="canonical"]') as HTMLLinkElement;
    if (!canonical) {
      canonical = document.createElement('link');
      canonical.rel = 'canonical';
      document.head.appendChild(canonical);
    }
    canonical.href = data.url || window.location.href;

    return () => {
      // Cleanup on unmount
      const metas = document.querySelectorAll('meta[data-seo="true"]');
      metas.forEach(meta => meta.remove());
    };
  }, [data.title, data.url, metaTags]);
};

export const useArticleStructuredData = (data: {
  title: string;
  description: string;
  author: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  tags?: string[];
  readTime?: string;
}) => {
  // Memoize structured data to prevent recalculation on every render
  const structuredData = useMemo(() => ({
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    "headline": data.title,
    "description": data.description,
    "image": data.image || '/logo.svg',
    "author": {
      "@type": "Person",
      "name": data.author,
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
      "@id": window.location.href
    },
    "keywords": data.tags?.join(', ') || '',
    ...(data.readTime && {
      "timeRequired": data.readTime
    })
  }), [data.title, data.description, data.author, data.datePublished, data.dateModified, data.image, data.tags, data.readTime]);

  useEffect(() => {
    // Remove existing structured data
    const existing = document.querySelector('script[data-structured-data="article"]');
    if (existing) existing.remove();

    // Create and insert structured data script
    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-structured-data', 'article');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const script = document.querySelector('script[data-structured-data="article"]');
      if (script) script.remove();
    };
  }, [structuredData]);
};