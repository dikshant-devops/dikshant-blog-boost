import { useEffect } from 'react';

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
  useEffect(() => {
    // Update document title
    document.title = data.title;

    // Remove existing SEO meta tags
    const existingMetas = document.querySelectorAll('meta[data-seo="true"]');
    existingMetas.forEach(meta => meta.remove());

    // Create new meta tags
    const metaTags = [
      { name: 'description', content: data.description },
      { name: 'keywords', content: data.keywords || '' },
      { name: 'author', content: data.author || 'Dikshant' },
      
      // Open Graph
      { property: 'og:title', content: data.title },
      { property: 'og:description', content: data.description },
      { property: 'og:type', content: data.type || 'article' },
      { property: 'og:url', content: data.url || window.location.href },
      { property: 'og:image', content: data.image || '/placeholder.svg' },
      { property: 'og:site_name', content: 'Tech With Dikshant' },
      
      // Twitter Cards
      { name: 'twitter:card', content: 'summary_large_image' },
      { name: 'twitter:site', content: '@techwithdikshant' },
      { name: 'twitter:title', content: data.title },
      { name: 'twitter:description', content: data.description },
      { name: 'twitter:image', content: data.image || '/placeholder.svg' },
      
      // Article specific
      ...(data.publishedTime ? [{ property: 'article:published_time', content: data.publishedTime }] : []),
      ...(data.modifiedTime ? [{ property: 'article:modified_time', content: data.modifiedTime }] : []),
      ...(data.tags ? data.tags.map(tag => ({ property: 'article:tag', content: tag })) : []),
    ];

    // Add meta tags to head
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
        document.head.appendChild(meta);
      }
    });

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
  }, [data]);
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
  useEffect(() => {
    // Remove existing structured data
    const existing = document.querySelector('script[data-structured-data="article"]');
    if (existing) existing.remove();

    // Create structured data for article
    const structuredData = {
      "@context": "https://schema.org",
      "@type": "BlogPosting",
      "headline": data.title,
      "description": data.description,
      "image": data.image || '/placeholder.svg',
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
          "url": "/placeholder.svg"
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
    };

    const script = document.createElement('script');
    script.type = 'application/ld+json';
    script.setAttribute('data-structured-data', 'article');
    script.textContent = JSON.stringify(structuredData);
    document.head.appendChild(script);

    return () => {
      const script = document.querySelector('script[data-structured-data="article"]');
      if (script) script.remove();
    };
  }, [data]);
};