import axios from 'axios';
import { limitTags, retryOperation } from '../utils.js';

/**
 * Post article link to LinkedIn
 */
export async function postToLinkedIn(articleData, accessToken, personUrn, summaries) {
  if (!accessToken) {
    throw new Error('LinkedIn access token not configured. Set LINKEDIN_ACCESS_TOKEN in .env');
  }

  if (!personUrn) {
    throw new Error('LinkedIn person URN not configured. Set LINKEDIN_PERSON_URN in .env');
  }

  const { frontmatter, canonicalUrl } = articleData;
  const summary = summaries.linkedin;

  // Add hashtags at the end
  const hashtags = limitTags(frontmatter.tags, 6)
    .map(tag => `#${tag}`)
    .join(' ');

  const text = `${summary}\n\n${hashtags}`;

  const payload = {
    author: personUrn,
    lifecycleState: 'PUBLISHED',
    specificContent: {
      'com.linkedin.ugc.ShareContent': {
        shareCommentary: {
          text: text
        },
        shareMediaCategory: 'ARTICLE',
        media: [
          {
            status: 'READY',
            originalUrl: canonicalUrl,
            title: {
              text: frontmatter.title
            },
            description: {
              text: frontmatter.excerpt || ''
            }
          }
        ]
      }
    },
    visibility: {
      'com.linkedin.ugc.MemberNetworkVisibility': 'PUBLIC'
    }
  };

  try {
    const response = await retryOperation(async () => {
      return await axios.post('https://api.linkedin.com/v2/ugcPosts', payload, {
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${accessToken}`,
          'X-Restli-Protocol-Version': '2.0.0'
        }
      });
    });

    const postId = response.data.id || '';
    const activityId = postId.split(':').pop();

    return {
      success: true,
      platform: 'LinkedIn',
      url: `https://www.linkedin.com/feed/update/${postId}`,
      id: activityId
    };
  } catch (error) {
    const message = error.response?.data?.message || error.message;
    throw new Error(`LinkedIn API error: ${message}`);
  }
}
