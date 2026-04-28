import { describe, it, expect, beforeEach, vi } from 'vitest';
import { loadMarkdownPosts, loadMarkdownPost, clearPostsCache } from './markdownLoader';

// Mock import.meta.glob
vi.mock('/public/blog-posts/*.md', () => ({}));

// Mock fetch for test environment
global.fetch = vi.fn();

const mockMarkdownContent = `---
title: "Test Blog Post"
excerpt: "This is a test post"
date: "2024-01-15"
readTime: "5 min read"
tags: ["Docker", "DevOps"]
---

# Test Blog Post

This is the content of a test blog post.`;

describe('markdownLoader', () => {
  beforeEach(() => {
    // Clear cache before each test
    clearPostsCache();
    // Clear any mocks
    vi.clearAllMocks();

    // Mock fetch to return content for known files, 404 for unknown
    (global.fetch as any).mockImplementation((url: string) => {
      // Manifest request
      if (url.includes('manifest')) {
        return Promise.resolve({
          ok: true,
          json: () => Promise.resolve(['test-blog-post.md']),
        });
      }
      // Known blog post files
      if (url.includes('test-blog-post.md')) {
        return Promise.resolve({
          ok: true,
          text: () => Promise.resolve(mockMarkdownContent),
        });
      }
      // Unknown files return 404
      return Promise.resolve({
        ok: false,
        status: 404,
        text: () => Promise.resolve('Not Found'),
      });
    });
  });

  describe('loadMarkdownPosts', () => {
    it('should load all markdown posts', async () => {
      const posts = await loadMarkdownPosts();

      expect(posts).toBeDefined();
      expect(Array.isArray(posts)).toBe(true);
      expect(posts.length).toBeGreaterThan(0);
    });

    it('should return posts with required fields', async () => {
      const posts = await loadMarkdownPosts();

      posts.forEach(post => {
        expect(post).toHaveProperty('id');
        expect(post).toHaveProperty('title');
        expect(post).toHaveProperty('excerpt');
        expect(post).toHaveProperty('date');
        expect(post).toHaveProperty('readTime');
        expect(post).toHaveProperty('tags');
        expect(post).toHaveProperty('content');
        expect(Array.isArray(post.tags)).toBe(true);
      });
    });

    it('should sort posts by date (newest first)', async () => {
      const posts = await loadMarkdownPosts();

      if (posts.length > 1) {
        for (let i = 0; i < posts.length - 1; i++) {
          const firstDate = new Date(posts[i].date);
          const secondDate = new Date(posts[i + 1].date);
          expect(firstDate.getTime()).toBeGreaterThanOrEqual(secondDate.getTime());
        }
      }
    });

    it('should cache posts on subsequent calls', async () => {
      const posts1 = await loadMarkdownPosts();
      const posts2 = await loadMarkdownPosts();

      // Should return the same cached instance
      expect(posts1).toBe(posts2);
    });

    it('should refresh cache when forceRefresh is true', async () => {
      const posts1 = await loadMarkdownPosts();
      const posts2 = await loadMarkdownPosts(true);

      // Should not be the same instance (new array created)
      expect(posts1).not.toBe(posts2);
      // But should have same content
      expect(posts1.length).toBe(posts2.length);
    });
  });

  describe('loadMarkdownPost', () => {
    it('should load a single post by ID', async () => {
      const allPosts = await loadMarkdownPosts();
      const firstPostId = allPosts[0].id;

      const post = await loadMarkdownPost(firstPostId);

      expect(post).toBeDefined();
      expect(post?.id).toBe(firstPostId);
    });

    it('should return null for non-existent post', async () => {
      const post = await loadMarkdownPost('non-existent-post-id-12345');

      expect(post).toBeNull();
    });

    it('should use cache when available', async () => {
      // Load all posts first to populate cache
      const allPosts = await loadMarkdownPosts();
      const firstPostId = allPosts[0].id;

      // This should use the cache
      const post = await loadMarkdownPost(firstPostId);

      expect(post).toBeDefined();
      expect(post?.id).toBe(firstPostId);
    });
  });

  describe('clearPostsCache', () => {
    it('should clear the cache', async () => {
      const posts1 = await loadMarkdownPosts();
      clearPostsCache();
      const posts2 = await loadMarkdownPosts();

      // Should not be the same instance after clearing cache
      expect(posts1).not.toBe(posts2);
    });
  });

  describe('auto-generated metadata', () => {
    it('should generate excerpts from content', async () => {
      const posts = await loadMarkdownPosts();

      posts.forEach(post => {
        expect(post.excerpt).toBeTruthy();
        expect(post.excerpt.length).toBeGreaterThan(0);
      });
    });

    it('should estimate read time based on content', async () => {
      const posts = await loadMarkdownPosts();

      posts.forEach(post => {
        expect(post.readTime).toMatch(/\d+ min read/);
      });
    });

    it('should auto-detect or assign tags', async () => {
      const posts = await loadMarkdownPosts();

      posts.forEach(post => {
        expect(post.tags.length).toBeGreaterThan(0);
      });
    });
  });
});
