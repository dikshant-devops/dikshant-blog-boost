import axios from 'axios';
import { convertImagePaths, limitTags, retryOperation } from '../utils.js';

/**
 * Post article to Dev.to
 */
export async function postToDevTo(articleData, apiKey, siteUrl) {
  if (!apiKey) {
    throw new Error('Dev.to API key not configured. Set DEVTO_API_KEY in .env');
  }

  const { frontmatter, content, canonicalUrl } = articleData;

  // Convert relative image paths to absolute
  const processedContent = convertImagePaths(content, siteUrl);

  // Add footer with original link
  const footer = `\n\n---\n\n*Originally published at [${siteUrl}](${canonicalUrl})*`;
  const fullContent = processedContent + footer;

  // Prepare tags (Dev.to allows max 4 tags)
  const tags = limitTags(frontmatter.tags, 4);

  const payload = {
    article: {
      title: frontmatter.title,
      body_markdown: fullContent,
      published: true,
      tags: tags,
      canonical_url: canonicalUrl,
      description: frontmatter.excerpt || '',
      series: frontmatter.playlist || frontmatter.series || undefined
    }
  };

  try {
    const response = await retryOperation(async () => {
      return await axios.post('https://api.forem.com/api/articles', payload, {
        headers: {
          'Content-Type': 'application/json',
          'api-key': apiKey
        }
      });
    });

    return {
      success: true,
      platform: 'Dev.to',
      url: response.data.url || `https://dev.to/${response.data.slug}`,
      id: response.data.id
    };
  } catch (error) {
    const message = error.response?.data?.error || error.message;
    throw new Error(`Dev.to API error: ${message}`);
  }
}
