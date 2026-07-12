import { describe, expect, it } from 'vitest';

import { assertNoEditorArtifacts, collectMarkdownImageUrls } from './verify-build.js';

describe('build source verification', () => {
  it('collects Markdown image destinations without matching links or code', () => {
    const markdown = '[docs](/guide)\n\n![Local](/images/diagram.png)\n\n`![code](ignored.png)`';
    expect(collectMarkdownImageUrls(markdown)).toEqual(['/images/diagram.png']);
  });

  it('rejects editor-only Lovable markup', () => {
    expect(() => assertNoEditorArtifacts('<lov-actions>hidden</lov-actions>', 'post.md'))
      .toThrow(/editor-specific/);
  });

  it('accepts ordinary technical Markdown', () => {
    expect(() => assertNoEditorArtifacts('## Deployment\n\nRun `kubectl apply`.', 'post.md'))
      .not.toThrow();
  });

  it('rejects trailing whitespace in published Markdown', () => {
    expect(() => assertNoEditorArtifacts('## Deployment  \n', 'post.md'))
      .toThrow(/trailing whitespace/);
  });
});
