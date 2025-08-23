import { BlogPost } from "@/data/blogPosts";

// Function to load and parse markdown files
export async function loadMarkdownPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  
  try {
    // In a real implementation, you would read from a directory
    // For now, we'll simulate loading the markdown files we created
    const markdownFiles = [
      'getting-started-with-docker.md',
      'kubernetes-introduction.md', 
      'github-actions-cicd.md'
    ];
    
    for (const filename of markdownFiles) {
      try {
        const response = await fetch(`/blog-posts/${filename}`);
        if (response.ok) {
          const content = await response.text();
          const post = parseMarkdownFile(content, filename);
          if (post) {
            posts.push(post);
          }
        }
      } catch (error) {
        console.warn(`Failed to load ${filename}:`, error);
      }
    }
  } catch (error) {
    console.error('Error loading markdown posts:', error);
  }
  
  // Sort posts by date (newest first)
  return posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
}

// Parse frontmatter and content from markdown file
function parseMarkdownFile(content: string, filename: string): BlogPost | null {
  try {
    // Simple frontmatter parser
    const frontmatterRegex = /^---\s*\n([\s\S]*?)\n---\s*\n([\s\S]*)$/;
    const match = content.match(frontmatterRegex);
    
    if (!match) {
      console.warn(`No frontmatter found in ${filename}`);
      return null;
    }
    
    const frontmatter = match[1];
    const markdownContent = match[2];
    
    // Parse frontmatter YAML-like content
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
    
    // Generate ID from filename
    const id = filename.replace('.md', '').replace(/[^a-z0-9]/gi, '-').toLowerCase();
    
    return {
      id,
      title: metadata.title || 'Untitled',
      excerpt: metadata.excerpt || '',
      date: metadata.date || new Date().toISOString(),
      readTime: metadata.readTime || '5 min read',
      tags: Array.isArray(metadata.tags) ? metadata.tags : ['Blog'],
      content: markdownContent
    };
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return null;
  }
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

import { useState, useEffect } from 'react';