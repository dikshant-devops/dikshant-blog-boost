import { describe, expect, it } from 'vitest';

import { buildSearchIndex, tokenizeForSearch } from './search.js';

describe('compact blog search index', () => {
  it('normalizes common technical word forms', () => {
    expect(tokenizeForSearch('service accounts and impersonation deployments'))
      .toEqual(['service', 'account', 'impersonate', 'deploy']);
  });

  it('weights metadata separately and bounds article terms', () => {
    const index = buildSearchIndex([{
      id: 'iam',
      title: 'GCP IAM Fundamentals',
      excerpt: 'Service account access',
      category: 'Security',
      platform: 'GCP',
      playlist: 'GCP IAM',
      tags: ['Cloud'],
      tools: ['gcloud'],
      headings: [{ text: 'Verify impersonation' }],
      searchText: Array.from({ length: 300 }, (_, index) => `term${index}`).join(' '),
    }]);

    expect(index.documents[0].terms.split(' ')).toHaveLength(180);
    expect(index.documents[0].terms).toContain('term0');
    expect(index.documents[0].terms).toContain('term299');
    expect(index.documents[0].boost).toContain('impersonate');
  });

  it('stays below the production budget for 100 vocabulary-heavy articles', () => {
    const posts = Array.from({ length: 100 }, (_, postIndex) => ({
      id: `post-${postIndex}`,
      title: `Technical guide ${postIndex}`,
      excerpt: `Production article ${postIndex}`,
      tags: ['DevOps'],
      tools: [],
      headings: [{ text: `Verification ${postIndex}` }],
      searchText: Array.from({ length: 300 }, (_, termIndex) => `term${postIndex}x${termIndex}`).join(' '),
    }));

    expect(Buffer.byteLength(JSON.stringify(buildSearchIndex(posts)))).toBeLessThan(250_000);
  });
});
