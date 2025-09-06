import { useState, useEffect } from 'react';
import { BlogPost } from "@/types/blog";

export async function loadMarkdownPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  
  try {
    // Dynamically load all .md files from the blog-posts directory
    // This approach fetches a directory listing or uses a manifest
    // For now, we'll try to load common markdown files and handle 404s gracefully
    const commonFiles = [
      'getting-started-with-docker.md',
      'kubernetes-introduction.md', 
      'github-actions-cicd.md',
      'essential-git-commands.md',
      'git-commands-visual-guide.md',
      'Cloud_Armor.md'
    ];
    
    // Try to load additional files that might exist
    const additionalFiles = Array.from({length: 20}, (_, i) => `blog-post-${i + 1}.md`);
    const allPossibleFiles = [...commonFiles, ...additionalFiles];
    
    const loadPromises = allPossibleFiles.map(async (filename) => {
      try {
        const response = await fetch(`/blog-posts/${filename}`);
        if (response.ok) {
          const content = await response.text();
          const post = parseMarkdownFile(content, filename);
          return post;
        }
        return null;
      } catch (error) {
        // Silently handle files that don't exist
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

// Function to load a single markdown post by ID
export async function loadMarkdownPost(id: string): Promise<BlogPost | null> {
  try {
    const response = await fetch(`/blog-posts/${id}.md`);
    if (response.ok) {
      const content = await response.text();
      return parseMarkdownFile(content, `${id}.md`);
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