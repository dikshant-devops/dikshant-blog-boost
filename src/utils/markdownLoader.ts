import { useState, useEffect } from 'react';
import { BlogPost } from "@/types/blog";

export async function loadMarkdownPosts(): Promise<BlogPost[]> {
  const posts: BlogPost[] = [];
  
  try {
    // Only load actual markdown files that exist
    const markdownFiles = [
      'getting-started-with-docker.md',
      'kubernetes-introduction.md', 
      'github-actions-cicd.md',
      'essential-git-commands.md',
      'git-commands-visual-guide.md',
      'Cloud_Armor.md'
    ];
    
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
      // Generate tags from filename or content
      const fileBasedTags = [];
      const fileName = filename.toLowerCase();
      
      if (fileName.includes('docker')) fileBasedTags.push('Docker');
      if (fileName.includes('kubernetes') || fileName.includes('k8s')) fileBasedTags.push('Kubernetes');
      if (fileName.includes('git')) fileBasedTags.push('Git');
      if (fileName.includes('cloud')) fileBasedTags.push('Cloud');
      if (fileName.includes('github')) fileBasedTags.push('GitHub');
      if (fileName.includes('ci') || fileName.includes('cd')) fileBasedTags.push('CI/CD');
      
      tags = fileBasedTags.length > 0 ? fileBasedTags : ['DevOps'];
    }

    // Generate ID from filename
    const id = filename.replace('.md', '').replace(/[^a-z0-9]/gi, '-').toLowerCase();

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
    // Map IDs to actual filenames
    const filenameMap: { [key: string]: string } = {
      'getting-started-with-docker': 'getting-started-with-docker.md',
      'kubernetes-introduction': 'kubernetes-introduction.md',
      'github-actions-cicd': 'github-actions-cicd.md',
      'essential-git-commands': 'essential-git-commands.md',
      'git-commands-visual-guide': 'git-commands-visual-guide.md',
      'cloud-armor': 'Cloud_Armor.md'
    };
    
    const filename = filenameMap[id] || `${id}.md`;
    const response = await fetch(`/blog-posts/${filename}`);
    if (response.ok) {
      const content = await response.text();
      // Check if response is actually markdown (not HTML)
      if (content.includes('# ') || content.includes('## ')) {
        return parseMarkdownFile(content, filename);
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