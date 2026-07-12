import { useState, useEffect } from 'react';
import { BlogPost } from "@/types/blog";
import { TAG_CONFIGS } from "@/config/tags";
import type { BlogSearchIndex } from "@/utils/blogSearch";

// Cache the compact indexes and hydrate full articles only on article routes.
let postsCache: BlogPost[] | null = null;
let cacheTimestamp: number = 0;
let searchIndexCache: BlogSearchIndex | null = null;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Map of filename to post ID for direct loading
const filenameToIdMap = new Map<string, string>();
const fullPostCache = new Map<string, BlogPost>();
const postDetailsCache = new Map<string, Pick<BlogPost, 'headings'>>();

type FrontmatterValue = string | string[] | undefined;
type FrontmatterMetadata = Record<string, FrontmatterValue>;

function stripFrontmatter(content: string): string {
  return content.replace(/^---\s*\n[\s\S]*?\n---\s*\n?/, '').trim();
}

function normalizeIndexedPost(post: Partial<BlogPost> & { slug?: string; fileName?: string }): BlogPost {
  const id = post.id || post.slug || '';
  const playlist = post.playlist || post.series || '';
  const playlistSlug = post.playlistSlug || post.seriesSlug || '';
  const playlistOrder = post.playlistOrder ?? post.seriesOrder;
  return {
    id,
    slug: post.slug || id,
    fileName: post.fileName,
    title: post.title || 'Untitled',
    excerpt: post.excerpt || 'No description available',
    date: post.date || new Date().toISOString().split('T')[0],
    updatedDate: post.updatedDate,
    readTime: post.readTime || '1 min read',
    wordCount: post.wordCount,
    author: post.author || 'Dikshant Rai',
    tags: Array.isArray(post.tags) ? post.tags : ['DevOps'],
    category: post.category || 'DevOps',
    platform: post.platform || '',
    tools: Array.isArray(post.tools) ? post.tools : [],
    playlist,
    playlistSlug,
    playlistOrder,
    playlistOnly: Boolean(post.playlistOnly),
    difficulty: post.difficulty || 'Beginner',
    featured: Boolean(post.featured),
    image: post.image || '/og-default.jpg',
    canonicalUrl: post.canonicalUrl,
    searchText: post.searchText || `${post.title || ''} ${post.excerpt || ''}`,
    headings: Array.isArray(post.headings) ? post.headings : [],
    content: post.content || ''
  };
}

async function loadIndexedPosts(): Promise<BlogPost[]> {
  const response = await fetch('/blog-posts-index.json');
  if (!response.ok) {
    throw new Error('Blog index not found');
  }

  const index = await response.json() as Array<Partial<BlogPost> & { slug?: string; fileName?: string }>;
  return index.map(normalizeIndexedPost);
}

export async function loadBlogSearchIndex(): Promise<BlogSearchIndex> {
  if (searchIndexCache) return searchIndexCache;

  const response = await fetch('/blog-search-index.json');
  if (!response.ok) throw new Error('Blog search index not found');

  const index = await response.json() as BlogSearchIndex;
  if (index.version !== 1 || !Array.isArray(index.documents)) {
    throw new Error('Unsupported blog search index');
  }
  searchIndexCache = index;
  return searchIndexCache;
}

async function loadBlogPostDetails(id: string): Promise<Pick<BlogPost, 'headings'>> {
  const cached = postDetailsCache.get(id);
  if (cached) return cached;

  try {
    const response = await fetch(`/blog-post-details/${encodeURIComponent(id)}.json`);
    if (!response.ok) return { headings: [] };
    const details = await response.json() as Pick<BlogPost, 'headings'>;
    const normalized = { headings: Array.isArray(details.headings) ? details.headings : [] };
    postDetailsCache.set(id, normalized);
    return normalized;
  } catch {
    return { headings: [] };
  }
}

async function hydrateIndexedPost(post: BlogPost): Promise<BlogPost | null> {
  if (post.content) return post;
  if (!post.fileName) return null;

  const [response, details] = await Promise.all([
    fetch(`/blog-posts/${encodeURIComponent(post.fileName)}`),
    loadBlogPostDetails(post.id)
  ]);
  if (!response.ok) return null;

  const markdown = await response.text();
  const fullPost = { ...post, ...details, content: stripFrontmatter(markdown) };
  fullPostCache.set(post.id, fullPost);
  return fullPost;
}

export async function loadMarkdownPosts(forceRefresh = false): Promise<BlogPost[]> {
  // Return cached posts if available and not expired
  if (!forceRefresh && postsCache && Date.now() - cacheTimestamp < CACHE_DURATION) {
    return postsCache;
  }

  try {
    const indexedPosts = await loadIndexedPosts();
    indexedPosts.forEach(post => {
      if (post.fileName) {
        filenameToIdMap.set(post.fileName, post.id);
      }
    });

    postsCache = indexedPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
    cacheTimestamp = Date.now();
    return postsCache;
  } catch (indexError) {
    console.warn('[markdownLoader] Could not load generated blog index, falling back to markdown manifest:', indexError);
  }

  const posts: BlogPost[] = [];

  try {
    // IMPORTANT: import.meta.glob cannot access /public/ folder in Vite
    // The /public/ folder is for static assets, not for module imports
    // Solution: Fetch a manifest file that lists all markdown files
    // This manifest can be auto-generated during build or manually updated
    let markdownFiles: string[] = [];

    try {
      const manifestResponse = await fetch('/blog-posts-manifest.json');
      if (manifestResponse.ok) {
        markdownFiles = await manifestResponse.json();
      } else {
        throw new Error('Manifest not found');
      }
    } catch (error) {
      // Fallback to hardcoded list if manifest is not available
      console.warn('[markdownLoader] Could not load manifest, using fallback list:', error);
      markdownFiles = [
        'github-actions-cicd.md',
        'git-commands-visual-guide.md',
        'getting-started-with-docker.md',
        'Host-Based vs Path-Based Routing.md',
        'Cloud_Armor.md',
        'kubernetes-introduction.md'
      ];
    }

    const loadPromises = markdownFiles.map(async (filename) => {
      try {
        const response = await fetch(`/blog-posts/${encodeURIComponent(filename)}`);
        if (response.ok) {
          const content = await response.text();
          const post = parseMarkdownFile(content, filename);
          if (post) {
            // Build filename to ID mapping for direct loading
            filenameToIdMap.set(filename, post.id);
          }
          return post;
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
  const sortedPosts = posts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  // Update cache
  postsCache = sortedPosts;
  cacheTimestamp = Date.now();

  return sortedPosts;
}

// Fallback parser for local dev/test if the generated index is unavailable.
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
      
      const metadata: FrontmatterMetadata = {};
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
      
      title = String(metadata.title || '');
      excerpt = String(metadata.excerpt || '');
      date = String(metadata.date || '');
      readTime = String(metadata.readTime || '');
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
      const autoTags: string[] = [];
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
      slug: id,
      fileName: filename,
      title: title.trim(),
      excerpt: excerpt.trim(),
      date,
      readTime,
      tags,
      category: tags.includes('CI/CD') ? 'CI/CD' : tags.includes('Docker') || tags.includes('Kubernetes') ? 'Containers' : tags.includes('GCP') || tags.includes('AWS') || tags.includes('Azure') ? 'Cloud' : 'DevOps',
      platform: tags.find(tag => ['GCP', 'AWS', 'Azure', 'Kubernetes', 'Docker'].includes(tag)) || '',
      tools: tags.filter(tag => ['GitHub Actions', 'Jenkins', 'Docker', 'Kubernetes', 'Git', 'Cloud Armor', 'Load Balancer'].includes(tag)),
      playlist: '',
      playlistOnly: false,
      difficulty: 'Beginner',
      author: 'Dikshant Rai',
      image: '/og-default.jpg',
      searchText: `${title} ${excerpt} ${markdownContent}`,
      headings: [],
      content: markdownContent.trim()
    };
  } catch (error) {
    console.error(`Error parsing ${filename}:`, error);
    return null;
  }
}

// Function to load a single markdown post by ID - OPTIMIZED for direct loading
export async function loadMarkdownPost(id: string): Promise<BlogPost | null> {
  try {
    if (fullPostCache.has(id)) {
      return fullPostCache.get(id) || null;
    }

    // Check cache first - if all posts are cached, find from cache
    if (postsCache && postsCache.length > 0) {
      const cachedPost = postsCache.find(p => p.id === id);
      if (cachedPost) {
        const fullPost = await hydrateIndexedPost(cachedPost);
        if (fullPost) return fullPost;
      }
    }

    const indexedPosts = await loadMarkdownPosts();
    const indexedPost = indexedPosts.find(p => p.id === id);
    if (indexedPost) {
      const fullPost = await hydrateIndexedPost(indexedPost);
      if (fullPost) return fullPost;
    }

    // If not in cache, try direct file loading using possible filename variations
    const possibleFilenames = [
      `${id}.md`,
      `${id.replace(/-/g, '_')}.md`,
      `${id.replace(/-/g, ' ')}.md`,
      `${id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')}.md`,
      `${id.split('-').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join('_')}.md`
    ];

    // Try to load directly from each possible filename
    for (const filename of possibleFilenames) {
      try {
        const response = await fetch(`/blog-posts/${encodeURIComponent(filename)}`);
        if (response.ok) {
          const content = await response.text();
          const post = parseMarkdownFile(content, filename);
          if (post && post.id === id) {
            fullPostCache.set(id, post);
            return post;
          }
        }
      } catch (error) {
        // Continue to next filename
        continue;
      }
    }

    // Last resort: load all posts and find the match (builds cache for future)
    const allPosts = await loadMarkdownPosts();
    return allPosts.find(p => p.id === id) || null;

  } catch (error) {
    console.warn(`Failed to load post ${id}:`, error);
  }
  return null;
}

// Clear cache manually (useful for admin or development)
export function clearPostsCache(): void {
  postsCache = null;
  cacheTimestamp = 0;
  filenameToIdMap.clear();
  fullPostCache.clear();
  postDetailsCache.clear();
  searchIndexCache = null;
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
