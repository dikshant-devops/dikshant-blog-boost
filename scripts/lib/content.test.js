import { describe, expect, it } from 'vitest';
import { parseBlogMarkdown, validateBlogPosts } from './content.js';

const articleBody = Array.from({ length: 32 }, (_, index) =>
  `Implementation step ${index + 1} records the command, observed output, validation result, rollback condition, and operational reasoning for this cloud security change.`
).join('\n\n');

const frontmatter = (overrides = '', body = `## Implementation\n\n${articleBody}`) => `---
title: "Standalone Google Cloud Security Note"
excerpt: "A focused Google Cloud implementation note with tested commands, observed results, rollback guidance, and production context."
date: "2026-07-12"
updatedDate: "2026-07-12"
category: "Cloud"
platform: "GCP"
difficulty: "Intermediate"
tags: ["GCP", "Security"]
${overrides}---

${body}
`;

describe('parseBlogMarkdown', () => {
  it('keeps a post standalone when series is omitted', () => {
    const post = parseBlogMarkdown('standalone-gcp-note.md', frontmatter());

    expect(post.series).toBe('');
    expect(post.seriesOrder).toBeUndefined();
  });

  it('accepts an explicit series and positive position', () => {
    const post = parseBlogMarkdown(
      'gcp-day-two.md',
      frontmatter('series: "GCP Day by Day"\nseriesOrder: 2\n')
    );

    expect(post.series).toBe('GCP Day by Day');
    expect(post.seriesOrder).toBe(2);
  });

  it('classifies Cloud Armor as security when category is inferred', () => {
    const source = frontmatter()
      .replace('category: "Cloud"\n', '')
      .replace('## Implementation', '## Cloud Armor security implementation');
    const post = parseBlogMarkdown('cloud-armor-policy.md', source);

    expect(post.category).toBe('Security');
    expect(post.platform).toBe('GCP');
  });

  it('rejects missing or invalid publication dates', () => {
    expect(() => parseBlogMarkdown(
      'missing-date.md',
      frontmatter().replace('date: "2026-07-12"\n', '')
    )).toThrow(/date is required/);

    expect(() => parseBlogMarkdown(
      'invalid-date.md',
      frontmatter().replace('date: "2026-07-12"', 'date: "2026-02-31"')
    )).toThrow(/valid calendar date/);
  });

  it('rejects seriesOrder when no series is supplied', () => {
    expect(() => parseBlogMarkdown(
      'invalid-order.md',
      frontmatter('seriesOrder: 1\n')
    )).toThrow(/requires a non-empty series/);
  });

  it('requires an explicit position when a series is supplied', () => {
    expect(() => parseBlogMarkdown(
      'missing-series-order.md',
      frontmatter('series: "Production GCP Security"\n')
    )).toThrow(/seriesOrder is required/);
  });

  it('rejects a second page title in the Markdown body', () => {
    expect(() => parseBlogMarkdown(
      'duplicate-title.md',
      frontmatter('', `# Duplicate title\n\n${articleBody}`)
    )).toThrow(/must not contain an H1/);
  });

  it('rejects thin content and unsupported social image formats', () => {
    expect(() => parseBlogMarkdown(
      'thin.md',
      frontmatter('', '## Implementation\n\nToo short.')
    )).toThrow(/at least 300 words/);

    expect(() => parseBlogMarkdown(
      'svg-image.md',
      frontmatter('image: "/logo.svg"\n')
    )).toThrow(/JPEG, PNG, or WebP/);
  });
});

describe('validateBlogPosts', () => {
  it('rejects duplicate slugs', () => {
    const first = parseBlogMarkdown('same-post.md', frontmatter());
    const second = parseBlogMarkdown('same_post.md', frontmatter());

    expect(() => validateBlogPosts([first, second])).toThrow(/Duplicate blog slug/);
  });

  it('rejects duplicate positions in the same series', () => {
    const first = parseBlogMarkdown(
      'series-one.md',
      frontmatter('series: "GCP Day by Day"\nseriesOrder: 1\n')
    );
    const second = parseBlogMarkdown(
      'series-two.md',
      frontmatter('series: "GCP Day by Day"\nseriesOrder: 1\n')
    );

    expect(() => validateBlogPosts([first, second])).toThrow(/Duplicate series position/);
  });

  it('rejects different series names that resolve to the same route slug', () => {
    const first = parseBlogMarkdown(
      'slug-series-one.md',
      frontmatter('series: "GCP + Security"\nseriesOrder: 1\n')
    );
    const second = parseBlogMarkdown(
      'slug-series-two.md',
      frontmatter('series: "GCP Security"\nseriesOrder: 2\n')
    );

    expect(() => validateBlogPosts([first, second])).toThrow(/resolve to the same slug/);
  });
});
