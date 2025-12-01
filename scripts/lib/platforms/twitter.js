import { limitTags } from '../utils.js';

/**
 * Generate Twitter/X tweet text (for manual posting)
 */
export function generateTwitterText(articleData, summaries) {
  const { frontmatter } = articleData;
  const { title, excerpt, url } = summaries.twitter;

  // Add hashtags (max 3-4 for Twitter)
  const hashtags = limitTags(frontmatter.tags, 4)
    .map(tag => `#${tag}`)
    .join(' ');

  const tweet = summaries.twitter.text + `\n\n${hashtags}`;

  // Validate length (Twitter limit is 280 chars)
  if (tweet.length > 280) {
    console.warn(`Warning: Tweet is ${tweet.length} characters (limit: 280). Consider shortening.`);
  }

  return {
    text: tweet,
    length: tweet.length,
    remaining: 280 - tweet.length
  };
}
