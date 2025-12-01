import axios from 'axios';
import { convertImagePaths, limitTags, retryOperation } from '../utils.js';

/**
 * Get Medium user ID
 */
async function getMediumUserId(token) {
  const response = await axios.get('https://api.medium.com/v1/me', {
    headers: {
      'Authorization': `Bearer ${token}`,
      'Accept': 'application/json'
    }
  });
  return response.data.data.id;
}

/**
 * Post article to Medium
 */
export async function postToMedium(articleData, token, siteUrl) {
  if (!token) {
    throw new Error('Medium integration token not configured. Set MEDIUM_TOKEN in .env');
  }

  const { frontmatter, content, canonicalUrl } = articleData;

  try {
    // Get user ID
    const userId = await getMediumUserId(token);

    // Convert relative image paths to absolute
    const processedContent = convertImagePaths(content, siteUrl);

    // Add footer with original link
    const footer = `\n\n---\n\n*Originally published at [${siteUrl}](${canonicalUrl})*`;
    const fullContent = processedContent + footer;

    // Prepare tags (Medium allows max 5 tags)
    const tags = limitTags(frontmatter.tags, 5);

    const payload = {
      title: frontmatter.title,
      contentFormat: 'markdown',
      content: fullContent,
      canonicalUrl: canonicalUrl,
      tags: tags,
      publishStatus: 'public'
    };

    const response = await retryOperation(async () => {
      return await axios.post(
        `https://api.medium.com/v1/users/${userId}/posts`,
        payload,
        {
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        }
      );
    });

    return {
      success: true,
      platform: 'Medium',
      url: response.data.data.url,
      id: response.data.data.id
    };
  } catch (error) {
    const message = error.response?.data?.errors?.[0]?.message || error.message;
    throw new Error(`Medium API error: ${message}`);
  }
}
