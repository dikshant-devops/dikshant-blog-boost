import { extractParagraphs } from './utils.js';

/**
 * Generate platform-specific summaries
 */
export function generateSummaries(content, frontmatter, canonicalUrl) {
  const excerpt = frontmatter.excerpt || '';
  const firstTwoParagraphs = extractParagraphs(content, 2);

  return {
    // LinkedIn summary (2-3 paragraphs, ~300 words)
    linkedin: generateLinkedInSummary(excerpt, firstTwoParagraphs, canonicalUrl),

    // Twitter summary (280 chars limit)
    twitter: generateTwitterSummary(frontmatter.title, excerpt, canonicalUrl),

    // Generic summary for preview
    generic: excerpt + '\n\n' + firstTwoParagraphs.split('\n\n')[0]
  };
}

function generateLinkedInSummary(excerpt, paragraphs, url) {
  const emoji = '📝';
  const readMore = '\n\n🔗 Read the full article';

  let summary = `${emoji} ${excerpt}`;

  if (paragraphs && paragraphs.length > 0) {
    summary += '\n\n' + paragraphs;
  }

  summary += `${readMore}: ${url}`;

  // Limit to reasonable length (~500 chars)
  if (summary.length > 500) {
    const truncated = summary.substring(0, 480).trim();
    summary = truncated + '...' + `${readMore}: ${url}`;
  }

  return summary;
}

function generateTwitterSummary(title, excerpt, url) {
  const emoji = '📝';
  const prefix = `${emoji} New: `;
  const hashtagSpace = 35; // Reserve space for hashtags

  // Calculate available space
  const urlLength = 23; // Twitter's t.co link length
  const availableLength = 280 - prefix.length - urlLength - hashtagSpace - 4; // 4 for newlines/spaces

  let summary = '';

  // Try to fit excerpt
  if (excerpt.length <= availableLength) {
    summary = excerpt;
  } else {
    // Truncate excerpt
    summary = excerpt.substring(0, availableLength - 3).trim() + '...';
  }

  return {
    text: `${prefix}${title}\n\n${summary}\n\n🔗 ${url}`,
    title,
    excerpt: summary,
    url
  };
}
