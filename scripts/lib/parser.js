import fs from 'fs/promises';
import matter from 'gray-matter';
import { validateFrontmatter, generateExcerpt } from './utils.js';

/**
 * Parse markdown file and extract frontmatter + content
 */
export async function parseMarkdownFile(filePath) {
  try {
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const { data: frontmatter, content } = matter(fileContent);

    // Validate frontmatter
    validateFrontmatter(frontmatter);

    // Generate excerpt if not provided
    if (!frontmatter.excerpt) {
      frontmatter.excerpt = generateExcerpt(content);
    }

    // Ensure tags is an array
    if (!frontmatter.tags) {
      frontmatter.tags = [];
    } else if (typeof frontmatter.tags === 'string') {
      frontmatter.tags = frontmatter.tags.split(',').map(t => t.trim());
    }

    // Ensure date is present
    if (!frontmatter.date) {
      frontmatter.date = new Date().toISOString().split('T')[0];
    }

    return {
      frontmatter,
      content,
      rawContent: fileContent
    };
  } catch (error) {
    throw new Error(`Failed to parse markdown file: ${error.message}`);
  }
}
