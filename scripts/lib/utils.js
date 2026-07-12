import path from 'path';
import { slugify } from './content.js';

/**
 * Build canonical URL from blog post filename
 */
export function buildCanonicalUrl(filename, siteUrl) {
  const slug = slugify(path.basename(filename, '.md'));

  return `${siteUrl}/blog/${slug}`;
}

/**
 * Validate required frontmatter fields
 */
export function validateFrontmatter(frontmatter) {
  const required = ['title'];
  const missing = required.filter(field => !frontmatter[field]);

  if (missing.length > 0) {
    const fields = missing.join(', ');
    throw new Error(`Missing required frontmatter fields: ${fields}`);
  }

  return true;
}

/**
 * Convert image paths to absolute URLs
 */
export function convertImagePaths(content, siteUrl) {
  // Match markdown images: ![alt](/path/to/image.png)
  return content.replace(/!\[([^\]]*)\]\(\/([^)]+)\)/g, (match, alt, imagePath) => {
    return `![${alt}](${siteUrl}/${imagePath})`;
  });
}

/**
 * Extract first N paragraphs from markdown content
 */
export function extractParagraphs(content, count = 2) {
  // Remove frontmatter if present
  content = content.replace(/^---[\s\S]*?---\n*/gm, '');

  // Remove H1 title
  content = content.replace(/^#\s+.+?\n+/m, '');

  // Split by double newlines (paragraphs)
  const paragraphs = content
    .split(/\n\n+/)
    .filter(p => p.trim().length > 0)
    .filter(p => !p.match(/^```/) && !p.match(/^#{1,6}\s/)) // Skip code blocks and headers
    .map(p => p.trim());

  return paragraphs.slice(0, count).join('\n\n');
}

/**
 * Generate excerpt from content if not provided
 */
export function generateExcerpt(content, maxLength = 200) {
  const text = extractParagraphs(content, 1)
    .replace(/[*_`#\[\]]/g, '') // Remove markdown formatting
    .replace(/\n/g, ' ')
    .trim();

  if (text.length <= maxLength) {
    return text;
  }

  return text.substring(0, maxLength).trim() + '...';
}

/**
 * Limit tags to maximum count
 */
export function limitTags(tags, max) {
  if (!Array.isArray(tags)) {
    return [];
  }
  return tags.slice(0, max).map(tag => tag.toLowerCase().replace(/\s+/g, ''));
}

/**
 * Sleep utility for rate limiting
 */
export function sleep(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Retry wrapper for API calls
 */
export async function retryOperation(operation, maxRetries = 3, delayMs = 1000) {
  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      return await operation();
    } catch (error) {
      if (attempt === maxRetries) {
        throw error;
      }
      console.warn(`Attempt ${attempt} failed, retrying in ${delayMs}ms...`);
      await sleep(delayMs * attempt); // Exponential backoff
    }
  }
}
