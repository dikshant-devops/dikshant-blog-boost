import { describe, expect, it } from 'vitest';
import { estimateReadTime, parseBlogMarkdown, validateBlogPosts } from './content.js';

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
  it('estimates prose and code reading time separately', () => {
    const prose = Array.from({ length: 200 }, () => 'word').join(' ');
    const code = Array.from({ length: 40 }, (_, index) => `command-${index}`).join('\n');
    expect(estimateReadTime(`${prose}\n\n\`\`\`bash\n${code}\n\`\`\``)).toEqual({
      wordCount: 200,
      readTime: '2 min read',
    });
  });

  it('rejects manual read time that would become stale', () => {
    expect(() => parseBlogMarkdown(
      'generated-read-time.md',
      frontmatter('readTime: "99 min read"\n')
    )).toThrow(/generated automatically/);
  });

  it('keeps a post standalone when playlist is omitted', () => {
    const post = parseBlogMarkdown('standalone-gcp-note.md', frontmatter());

    expect(post.playlist).toBe('');
    expect(post.playlistOrder).toBeUndefined();
  });

  it('accepts an explicit playlist and positive position', () => {
    const post = parseBlogMarkdown(
      'gcp-day-two.md',
      frontmatter('playlist: "GCP Day by Day"\nplaylistOrder: 2\n')
    );

    expect(post.playlist).toBe('GCP Day by Day');
    expect(post.playlistSlug).toBe('gcp-day-by-day');
    expect(post.playlistOrder).toBe(2);
  });

  it('accepts playlist-only discovery only for playlist members', () => {
    const post = parseBlogMarkdown(
      'playlist-only-gcp.md',
      frontmatter('playlist: "GCP Day by Day"\nplaylistOrder: 3\nplaylistOnly: true\n')
    );

    expect(post.playlistOnly).toBe(true);
    expect(() => parseBlogMarkdown(
      'invalid-playlist-only.md',
      frontmatter('playlistOnly: true\n')
    )).toThrow(/requires playlist membership/);
  });

  it('normalizes legacy series metadata into playlist fields', () => {
    const post = parseBlogMarkdown(
      'legacy-gcp-day-two.md',
      frontmatter('series: "GCP Day by Day"\nseriesOrder: 2\n')
    );

    expect(post.playlist).toBe('GCP Day by Day');
    expect(post.playlistOrder).toBe(2);
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

  it('rejects playlistOrder when no playlist is supplied', () => {
    expect(() => parseBlogMarkdown(
      'invalid-order.md',
      frontmatter('playlistOrder: 1\n')
    )).toThrow(/requires a non-empty playlist/);
  });

  it('requires an explicit position when a playlist is supplied', () => {
    expect(() => parseBlogMarkdown(
      'missing-playlist-order.md',
      frontmatter('playlist: "Production GCP Security"\n')
    )).toThrow(/playlistOrder is required/);
  });

  it('requires a supported platform and matching platform tag for playlists', () => {
    expect(() => parseBlogMarkdown(
      'azure-playlist.md',
      frontmatter('playlist: "Azure Operations"\nplaylistOrder: 1\n')
        .replace('platform: "GCP"', 'platform: "Azure"')
        .replace('tags: ["GCP", "Security"]', 'tags: ["Azure", "Security"]')
    )).toThrow(/only for GCP, AWS, or Kubernetes/);

    expect(() => parseBlogMarkdown(
      'missing-platform-tag.md',
      frontmatter('playlist: "GCP Operations"\nplaylistOrder: 1\n')
        .replace('tags: ["GCP", "Security"]', 'tags: ["Security"]')
    )).toThrow(/must include the platform tag/);
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

  it('rejects duplicate positions in the same playlist', () => {
    const first = parseBlogMarkdown(
      'playlist-one.md',
      frontmatter('playlist: "GCP Day by Day"\nplaylistOrder: 1\n')
    );
    const second = parseBlogMarkdown(
      'playlist-two.md',
      frontmatter('playlist: "GCP Day by Day"\nplaylistOrder: 1\n')
    );

    expect(() => validateBlogPosts([first, second])).toThrow(/Duplicate playlist position/);
  });

  it('rejects different playlist names that resolve to the same route slug', () => {
    const first = parseBlogMarkdown(
      'slug-playlist-one.md',
      frontmatter('playlist: "GCP + Security"\nplaylistOrder: 1\n')
    );
    const second = parseBlogMarkdown(
      'slug-playlist-two.md',
      frontmatter('playlist: "GCP Security"\nplaylistOrder: 2\n')
    );

    expect(() => validateBlogPosts([first, second])).toThrow(/resolve to the same slug/);
  });

  it('rejects a playlist that mixes platforms', () => {
    const gcp = parseBlogMarkdown(
      'gcp-playlist.md',
      frontmatter('playlist: "Cloud Operations"\nplaylistOrder: 1\n')
    );
    const aws = parseBlogMarkdown(
      'aws-playlist.md',
      frontmatter('playlist: "Cloud Operations"\nplaylistOrder: 2\n')
        .replace('platform: "GCP"', 'platform: "AWS"')
        .replace('tags: ["GCP", "Security"]', 'tags: ["AWS", "Security"]')
    );

    expect(() => validateBlogPosts([gcp, aws])).toThrow(/mixes platforms/);
  });
});
