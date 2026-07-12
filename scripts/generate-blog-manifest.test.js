import { describe, expect, it } from 'vitest';
import { buildSitemap } from './generate-blog-manifest.js';

describe('buildSitemap', () => {
  it('includes one canonical URL per explicit playlist and no inferred collections', () => {
    const posts = [
      {
        canonicalUrl: 'https://techwithdikshant.com/blog/part-one',
        date: '2026-01-01',
        updatedDate: '2026-01-02',
        playlist: 'Production GCP Security',
        playlistSlug: 'production-gcp-security',
      },
      {
        canonicalUrl: 'https://techwithdikshant.com/blog/part-two',
        date: '2026-01-03',
        playlist: 'Production GCP Security',
        playlistSlug: 'production-gcp-security',
      },
      {
        canonicalUrl: 'https://techwithdikshant.com/blog/standalone',
        date: '2026-01-04',
        playlist: '',
        playlistSlug: '',
      },
    ];

    const sitemap = buildSitemap(posts);

    expect(sitemap.match(/<loc>https:\/\/techwithdikshant.com\/playlists\/production-gcp-security<\/loc>/g)).toHaveLength(1);
    expect(sitemap).not.toContain('/playlists/standalone');
    expect(sitemap).toContain('<lastmod>2026-01-03</lastmod>');
  });
});
