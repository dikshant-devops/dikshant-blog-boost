import { useState, useEffect } from 'react';
import { BlogPost } from "@/types/blog";
import { TAG_CONFIGS } from "@/config/tags";

export async function loadMarkdownPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  
  try {
    // Use import.meta.glob to automatically discover all markdown files
    const modules = import.meta.glob('/public/blog-posts/*.md', { as: 'url' });
    const markdownFiles = Object.keys(modules).map(path => path.split('/').pop()!);
    
    const loadPromises = markdownFiles.map(async (filename) => {
      try {
        const response = await fetch(`/blog-posts/${filename}`);
        if (response.ok) {
          const content = await response.text();
          // Check if response is actually markdown (not HTML)
          if (content.includes('---') || content.includes('# ')) {
            const post = parseMarkdownFile(content, filename);
            return post;
          }
        }
        return null;
      } catch (error) {
        console.warn(`Failed to load ${filename}:`, error);
        return null;
      }
    });
    
    const results = await Promise.all(loadPromises);
    const validPosts = results.filter((post): post is BlogPost => post !== null);
    posts.push(...validPosts);
    
  } catch (error) {
    console.error('Error loading markdown posts:', error);
  }
  
  // Sort posts by date (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Parse markdown file with or without frontmatter
function parseMarkdownFile(content: string, filename: string): BlogPost | null {
  try {
    let title = '';
    let excerpt = '';
    let date = '';
    let readTime = '';
    let tags: string[] = [];
    let markdownContent = content;

    // Check if file has frontmatter
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const frontmatterMatch = content.match(frontmatterRegex);
    
    if (frontmatterMatch) {
      // Parse frontmatter if it exists
      const frontmatter = frontmatterMatch[1];
      markdownContent = frontmatterMatch[2];
      
      const metadata: any = {};
      const lines = frontmatter.split('\n');
      
      for (const line of lines) {
        const colonIndex = line.indexOf(':');
        if (colonIndex > 0) {
          const key = line.substring(0, colonIndex).trim();
          let value = line.substring(colonIndex + 1).trim();
          
          // Remove quotes if present
          if ((value.startsWith('"') && value.endsWith('"')) || 
              (value.startsWith("'") && value.endsWith("'"))) {
            value = value.slice(1, -1);
          }
          
          // Handle arrays (tags)
          if (key === 'tags' && value.startsWith('[') && value.endsWith(']')) {
            const tagsArray = value.slice(1, -1).split(',').map(tag => 
              tag.trim().replace(/^["']|["']$/g, '')
            );
            metadata[key] = tagsArray;
          } else {
            metadata[key] = value;
          }
        }
      }
      
      title = metadata.title || '';
      excerpt = metadata.excerpt || '';
      date = metadata.date || '';
      readTime = metadata.readTime || '';
      tags = Array.isArray(metadata.tags) ? metadata.tags : [];
    }

    // Generate defaults if no frontmatter or missing fields
    if (!title) {
      // Extract title from first heading or filename
      const headingMatch = markdownContent.match(/^#\s+(.+)$/m);
      title = headingMatch ? headingMatch[1] : filename.replace('.md', '').replace(/[-_]/g, ' ');
    }

    if (!excerpt) {
      // Generate excerpt from first paragraph
      const paragraphs = markdownContent.split('\n\n').filter(p => 
        p.trim() && !p.startsWith('#') && !p.startsWith('```') && !p.startsWith('---')
      );
      excerpt = paragraphs[0] ? paragraphs[0].substring(0, 150) + '...' : 'No description available';
    }

    if (!date) {
      // Use current date if no date specified
      date = new Date().toISOString().split('T')[0];
    }

    if (!readTime) {
      // Estimate read time (average 200 words per minute)
      const wordCount = markdownContent.split(/\s+/).length;
      const minutes = Math.ceil(wordCount / 200);
      readTime = `${minutes} min read`;
    }

    if (tags.length === 0) {
      // Auto-detect tags from filename and content if not specified in frontmatter
      const autoTags = [];
      const fileName = filename.toLowerCase();
      const contentLower = markdownContent.toLowerCase();
      
      // Check against all available tag configs
      Object.keys(TAG_CONFIGS).forEach(tagName => {
        const tagLower = tagName.toLowerCase();
        if (fileName.includes(tagLower) || contentLower.includes(tagLower)) {
          autoTags.push(tagName);
        }
      });
      
      // Special cases for common variations
      if (fileName.includes('k8s') || contentLower.includes('k8s')) autoTags.push('Kubernetes');
      if (fileName.includes('cicd') || fileName.includes('ci-cd')) autoTags.push('CI/CD');
      if (fileName.includes('routing') || fileName.includes('load-balancer')) autoTags.push('Networking', 'Load Balancer');
      if (fileName.includes('host') || fileName.includes('path')) autoTags.push('Load Balancer');
      
      tags = autoTags.length > 0 ? [...new Set(autoTags)] : ['DevOps'];
    }

    // Generate ID from filename - handle any filename format
    const id = filename
      .replace('.md', '')
      .replace(/[^a-z0-9\s]/gi, '-') // Replace special chars with dashes
      .replace(/\s+/g, '-') // Replace spaces with dashes
      .replace(/-+/g, '-') // Replace multiple dashes with single dash
      .replace(/^-|-$/g, '') // Remove leading/trailing dashes
      .toLowerCase();

    return {
      id,
      title: title.trim(),
      excerpt: excerpt.trim(),
      date,
      readTime,
      tags,
      content: markdownContent.trim()
    };
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return null;
  }
}

// Function to load a single markdown post by ID
export async function loadMarkdownPost(id: string): Promise<BlogPost | null> {
  try {
    // First, try to load all posts and find the one with matching ID
    const allPosts = await loadMarkdownPosts();
    const post = allPosts.find(p => p.id === id);
    
    if (post) {
      return post;
    }
    
    // Fallback: try direct filename mapping
    const possibleFilenames = [
      `${id}.md`,
      `${id.replace(/-/g, '_')}.md`,
      `${id.replace(/-/g, ' ')}.md`,
      `${id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}.md`,
      `${id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_')}.md`
    ];
    
    for (const filename of possibleFilenames) {
      try {
        const response = await fetch(`/blog-posts/${filename}`);
        if (response.ok) {
          const content = await response.text();
          if (content.includes('# ') || content.includes('## ')) {
            return parseMarkdownFile(content, filename);
          }
        }
      } catch (error) {
        // Continue to next filename
        continue;
      }
    }
  } catch (error) {
    console.warn(`Failed to load post ${id}:`, error);
  }
  return null;
}

// Hook to use markdown posts with React
export function useMarkdownPosts() {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  useEffect(() => {
    loadMarkdownPosts()
      .then(setPosts)
      .catch(err => {
        console.error('Failed to load markdown posts:', err);
        setError(err.message);
      })
      .finally(() => setLoading(false));
  }, []);
  
  return { posts, loading, error };
}