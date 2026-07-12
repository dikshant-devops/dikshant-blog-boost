export type DraftValidationInput = {
  title: string;
  excerpt: string;
  content: string;
  author: string;
  image: string;
  tags: string[];
  platform: string;
  playlist: string;
  playlistOrder: string;
  playlistOnly: boolean;
};

const inspectMarkdownBody = (content: string) => {
  let inFence = false;
  let hasH1 = false;
  const prose: string[] = [];

  content.split('\n').forEach(line => {
    if (/^\s*```/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;
    if (/^#\s+/.test(line)) hasH1 = true;
    prose.push(line.replace(/[#>*_`~|[\]()-]/g, ' '));
  });

  return {
    hasH1,
    wordCount: prose.join(' ').split(/\s+/).filter(Boolean).length
  };
};

export const validateBlogDraft = (draft: DraftValidationInput): string[] => {
  const errors: string[] = [];
  const body = inspectMarkdownBody(draft.content);

  if (draft.title.trim().length < 30 || draft.title.trim().length > 65) errors.push('Title must be 30-65 characters.');
  if (draft.excerpt.trim().length < 90 || draft.excerpt.trim().length > 180) errors.push('Excerpt must be 90-180 characters.');
  if (!draft.author.trim()) errors.push('Author is required.');
  if (draft.tags.length < 1 || draft.tags.length > 8) errors.push('Add between 1 and 8 tags.');
  if (!/\.(?:jpe?g|png|webp)(?:\?.*)?$/i.test(draft.image.trim())) errors.push('Social image must be JPEG, PNG, or WebP.');
  if (body.hasH1) errors.push('Do not add an H1 in the body; the title is the page H1.');
  if (body.wordCount < 300) errors.push('Article body must contain at least 300 non-code words.');
  if (!draft.playlist.trim() && draft.playlistOrder.trim()) {
    errors.push('Playlist name is required when an order is supplied.');
  }
  if (draft.playlist.trim() && (!/^\d+$/.test(draft.playlistOrder) || Number(draft.playlistOrder) < 1)) {
    errors.push('Playlist order must be a positive integer.');
  }
  if (draft.playlist.trim() && !['GCP', 'AWS', 'Kubernetes'].includes(draft.platform)) {
    errors.push('Playlists are supported only for GCP, AWS, or Kubernetes posts.');
  }
  if (draft.playlist.trim() && !draft.tags.includes(draft.platform)) {
    errors.push(`Playlist posts must include the ${draft.platform || 'platform'} tag.`);
  }
  if (draft.playlistOnly && !draft.playlist.trim()) {
    errors.push('Playlist-only discovery requires playlist membership.');
  }
  return errors;
};
