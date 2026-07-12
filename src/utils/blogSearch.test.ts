import { describe, expect, it } from 'vitest';

import type { BlogPost } from '@/types/blog';
import { rankBlogPosts, tokenizeSearchQuery, type BlogSearchIndex } from './blogSearch';

const posts = [
  { id: 'gcp-iam', title: 'GCP IAM Fundamentals', excerpt: 'Identity controls', tags: ['GCP'], date: '2026-01-01', readTime: '5 min read', content: '' },
  { id: 'aws-iam', title: 'AWS IAM Fundamentals', excerpt: 'Identity controls', tags: ['AWS'], date: '2026-01-01', readTime: '5 min read', content: '' },
] as BlogPost[];

const index: BlogSearchIndex = {
  version: 1,
  documents: [
    { id: 'gcp-iam', terms: 'service account impersonate policy', boost: 'google cloud iam' },
    { id: 'aws-iam', terms: 'role trust policy service', boost: 'amazon aws iam' },
  ],
};

describe('blog search ranking', () => {
  it('normalizes related word forms', () => {
    expect(tokenizeSearchQuery('service account impersonation')).toEqual(['service', 'account', 'impersonate']);
  });

  it('matches non-contiguous terms using AND semantics', () => {
    const results = rankBlogPosts(posts, index, 'service account impersonate');
    expect([...results.keys()]).toEqual(['gcp-iam']);
  });

  it('does not return a document that matches only some query terms', () => {
    expect(rankBlogPosts(posts, index, 'role account').size).toBe(0);
  });

  it('can search listing metadata before the full index loads', () => {
    expect(rankBlogPosts(posts, null, 'AWS IAM').has('aws-iam')).toBe(true);
  });
});
