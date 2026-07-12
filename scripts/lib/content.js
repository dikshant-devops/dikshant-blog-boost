import matter from 'gray-matter';
import path from 'path';
import { fromMarkdown } from 'mdast-util-from-markdown';

export const SITE_URL = process.env.SITE_URL || 'https://techwithdikshant.com';

export const CATEGORIES = [
  'Cloud',
  'CI/CD',
  'Containers',
  'Networking',
  'Security',
  'Developer Tools',
  'Observability',
  'DevOps'
];

export const PLATFORMS = ['GCP', 'AWS', 'Azure', 'Kubernetes', 'Docker'];

export const DIFFICULTIES = ['Beginner', 'Intermediate', 'Advanced'];

const ISO_DATE = /^\d{4}-\d{2}-\d{2}$/;

export const TOOLS = [
  'GitHub Actions',
  'Jenkins',
  'Terraform',
  'Docker',
  'Kubernetes',
  'Git',
  'Cloud Armor',
  'Load Balancer',
  'Prometheus',
  'Grafana',
  'Ansible'
];

const KEYWORD_TAGS = [
  ['github actions', 'GitHub Actions'],
  ['jenkins', 'Jenkins'],
  ['ci/cd', 'CI/CD'],
  ['cicd', 'CI/CD'],
  ['ci-cd', 'CI/CD'],
  ['docker', 'Docker'],
  ['container', 'Containers'],
  ['kubernetes', 'Kubernetes'],
  ['k8s', 'Kubernetes'],
  ['terraform', 'Terraform'],
  ['ansible', 'Ansible'],
  ['google cloud', 'GCP'],
  ['gcp', 'GCP'],
  ['cloud armor', 'Cloud Armor'],
  ['aws', 'AWS'],
  ['azure', 'Azure'],
  ['load balancer', 'Load Balancer'],
  ['routing', 'Networking'],
  ['network', 'Networking'],
  ['security', 'Security'],
  ['waf', 'Security'],
  ['monitoring', 'Observability'],
  ['observability', 'Observability'],
  ['prometheus', 'Prometheus'],
  ['grafana', 'Grafana'],
  ['git ', 'Git'],
  ['version control', 'Git']
];

export function slugify(value) {
  return String(value || '')
    .toLowerCase()
    .trim()
    .replace(/&/g, ' and ')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .replace(/-{2,}/g, '-');
}

export function stripMarkdown(content) {
  return content
    .replace(/^---[\s\S]*?---\s*/m, '')
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/!\[[^\]]*]\([^)]+\)/g, ' ')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/[#>*_`~|[\]()-]/g, ' ')
    .replace(/:{2,}/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

export function extractTitle(content, filename) {
  const h1 = content.match(/^#\s+(.+)$/m);
  if (h1) return h1[1].trim();
  return path.basename(filename, '.md').replace(/[-_]+/g, ' ').trim();
}

export function extractExcerpt(content, maxLength = 180) {
  const withoutFrontmatter = content.replace(/^---[\s\S]*?---\s*/m, '');
  const paragraph = withoutFrontmatter
    .split(/\n{2,}/)
    .map(item => item.trim())
    .find(item => item && !item.startsWith('#') && !item.startsWith('```'));
  const text = stripMarkdown(paragraph || withoutFrontmatter);
  return text.length > maxLength ? `${text.slice(0, maxLength).trim()}...` : text;
}

export function estimateReadTime(content) {
  const words = stripMarkdown(content).split(/\s+/).filter(Boolean).length;
  return {
    wordCount: words,
    readTime: `${Math.max(1, Math.ceil(words / 200))} min read`
  };
}

function nodeText(node) {
  if (typeof node.value === 'string') return node.value;
  return Array.isArray(node.children) ? node.children.map(nodeText).join('') : '';
}

function extractDocumentHeadings(content) {
  const counts = new Map();
  const document = fromMarkdown(content);

  return document.children
    .filter(node => node.type === 'heading')
    .map(node => {
      const text = nodeText(node).trim();
      const baseId = slugify(text);
      const nextCount = (counts.get(baseId) || 0) + 1;
      counts.set(baseId, nextCount);
      return {
        id: nextCount === 1 ? baseId : `${baseId}-${nextCount}`,
        text,
        level: node.depth,
        line: node.position?.start.line
      };
    });
}

export function extractHeadings(content) {
  return extractDocumentHeadings(content).filter(heading => heading.level === 2 || heading.level === 3);
}

function normalizeList(value) {
  if (!value) return [];
  if (Array.isArray(value)) return value.map(String).map(item => item.trim()).filter(Boolean);
  return String(value).split(',').map(item => item.trim()).filter(Boolean);
}

function detectTags(filename, content) {
  const source = `${filename} ${content}`.toLowerCase();
  const tags = [];
  for (const [needle, tag] of KEYWORD_TAGS) {
    if (source.includes(needle)) tags.push(tag);
  }
  return [...new Set(tags.length ? tags : ['DevOps'])];
}

function inferPlatform(tags, content) {
  const source = `${tags.join(' ')} ${content}`.toLowerCase();
  if (source.includes('google cloud') || source.includes('gcp') || source.includes('cloud armor')) return 'GCP';
  if (source.includes('aws') || source.includes('amazon web services')) return 'AWS';
  if (source.includes('azure')) return 'Azure';
  if (source.includes('kubernetes') || source.includes('k8s')) return 'Kubernetes';
  if (source.includes('docker')) return 'Docker';
  return '';
}

function inferCategory(tags, content) {
  const source = `${tags.join(' ')} ${content}`.toLowerCase();
  if (source.includes('ci/cd') || source.includes('cicd') || source.includes('github actions') || source.includes('jenkins')) return 'CI/CD';
  if (source.includes('aws') || source.includes('azure') || source.includes('gcp') || source.includes('google cloud')) return 'Cloud';
  if (source.includes('docker') || source.includes('kubernetes') || source.includes('container')) return 'Containers';
  if (source.includes('route') || source.includes('load balancer') || source.includes('network')) return 'Networking';
  if (source.includes('security') || source.includes('waf') || source.includes('cloud armor')) return 'Security';
  if (source.includes('monitoring') || source.includes('observability')) return 'Observability';
  if (source.includes('git ') || source.includes('version control')) return 'Developer Tools';
  return 'DevOps';
}

function inferTools(tags, content) {
  const source = `${tags.join(' ')} ${content}`.toLowerCase();
  return TOOLS.filter(tool => source.includes(tool.toLowerCase()));
}

function normalizeDate(value, field, filename, required = false) {
  const normalized = String(value || '').trim();
  if (!normalized) {
    if (required) throw new Error(`${filename}: ${field} is required`);
    return '';
  }

  if (!ISO_DATE.test(normalized)) {
    throw new Error(`${filename}: ${field} must use YYYY-MM-DD format`);
  }

  const [year, month, day] = normalized.split('-').map(Number);
  const parsed = new Date(Date.UTC(year, month - 1, day));
  if (
    parsed.getUTCFullYear() !== year ||
    parsed.getUTCMonth() !== month - 1 ||
    parsed.getUTCDate() !== day
  ) {
    throw new Error(`${filename}: ${field} is not a valid calendar date`);
  }

  return normalized;
}

function normalizeSeriesOrder(value, series, filename) {
  if (value === undefined || value === null || value === '') return undefined;
  if (!series) throw new Error(`${filename}: seriesOrder requires a non-empty series`);

  const normalized = Number(value);
  if (!Number.isInteger(normalized) || normalized < 1) {
    throw new Error(`${filename}: seriesOrder must be a positive integer`);
  }
  return normalized;
}

function normalizeFeatured(value, filename) {
  if (value === undefined || value === null || value === '') return false;
  if (value === true || value === 'true') return true;
  if (value === false || value === 'false') return false;
  throw new Error(`${filename}: featured must be true or false`);
}

export function parseBlogMarkdown(filename, rawContent, siteUrl = SITE_URL) {
  const parsed = matter(rawContent);
  const content = parsed.content.trim();
  const data = parsed.data || {};
  const title = String(data.title || extractTitle(content, filename)).trim();
  const id = slugify(data.slug || path.basename(filename, '.md'));
  if (!id) throw new Error(`${filename}: slug resolves to an empty value`);
  if (!title) throw new Error(`${filename}: title is required`);
  if (title.length < 30 || title.length > 65) {
    throw new Error(`${filename}: title must be between 30 and 65 characters`);
  }
  const documentHeadings = extractDocumentHeadings(content);
  if (documentHeadings.some(heading => heading.level === 1)) {
    throw new Error(`${filename}: body must not contain an H1; frontmatter title is the page H1`);
  }

  const tags = [...new Set(normalizeList(data.tags))];
  const detectedTags = tags.length ? tags : detectTags(filename, content);
  const category = String(data.category ?? inferCategory(detectedTags, content));
  const platform = String(data.platform ?? inferPlatform(detectedTags, content));
  if (!CATEGORIES.includes(category)) {
    throw new Error(`${filename}: unsupported category "${category}"`);
  }
  if (platform && !PLATFORMS.includes(platform)) {
    throw new Error(`${filename}: unsupported platform "${platform}"`);
  }

  const tools = [...new Set(normalizeList(data.tools))];
  const detectedTools = tools.length ? tools : inferTools(detectedTags, content);
  const series = String(data.series ?? '').trim();
  const seriesOrder = normalizeSeriesOrder(data.seriesOrder ?? data.day, series, filename);
  const readStats = estimateReadTime(content);
  const date = normalizeDate(data.date, 'date', filename, true);
  const updatedDate = normalizeDate(data.updatedDate || data.modifiedDate || date, 'updatedDate', filename);
  const excerpt = String(data.excerpt || extractExcerpt(content));
  if (!excerpt.trim()) throw new Error(`${filename}: excerpt is required`);
  if (excerpt.trim().length < 90 || excerpt.trim().length > 180) {
    throw new Error(`${filename}: excerpt must be between 90 and 180 characters`);
  }

  const difficulty = String(data.difficulty || 'Beginner');
  if (!DIFFICULTIES.includes(difficulty)) {
    throw new Error(`${filename}: unsupported difficulty "${difficulty}"`);
  }

  const author = String(data.author || 'Dikshant Sharma').trim();
  if (!author) throw new Error(`${filename}: author is required`);
  if (detectedTags.length < 1 || detectedTags.length > 8) {
    throw new Error(`${filename}: tags must contain between 1 and 8 unique values`);
  }
  if (readStats.wordCount < 300) {
    throw new Error(`${filename}: article body must contain at least 300 words`);
  }
  if (updatedDate < date) {
    throw new Error(`${filename}: updatedDate cannot be earlier than date`);
  }

  const image = String(data.image || '/og-default.jpg').trim();
  if (!/\.(?:jpe?g|png|webp)(?:\?.*)?$/i.test(image)) {
    throw new Error(`${filename}: image must be a JPEG, PNG, or WebP social image`);
  }

  const headings = documentHeadings.filter(heading => heading.level === 2 || heading.level === 3);
  let previousLevel = 1;
  for (const heading of headings) {
    if (heading.level > previousLevel + 1) {
      throw new Error(`${filename}: heading hierarchy skips from H${previousLevel} to H${heading.level}`);
    }
    previousLevel = heading.level;
  }

  return {
    id,
    slug: id,
    fileName: filename,
    title,
    excerpt: excerpt.trim(),
    date,
    updatedDate,
    readTime: String(data.readTime || readStats.readTime),
    wordCount: readStats.wordCount,
    author,
    tags: detectedTags,
    category,
    platform,
    tools: detectedTools,
    series,
    seriesSlug: series ? slugify(series) : '',
    seriesOrder,
    difficulty,
    featured: normalizeFeatured(data.featured, filename),
    image,
    canonicalUrl: `${siteUrl.replace(/\/$/, '')}/blog/${id}`,
    searchText: stripMarkdown(content),
    headings
  };
}

export function validateBlogPosts(posts) {
  const slugs = new Map();
  const seriesPositions = new Map();

  for (const post of posts) {
    if (slugs.has(post.id)) {
      throw new Error(`Duplicate blog slug "${post.id}" in ${slugs.get(post.id)} and ${post.fileName}`);
    }
    slugs.set(post.id, post.fileName);

    if (post.series && post.seriesOrder !== undefined) {
      const positionKey = `${post.series.toLowerCase()}::${post.seriesOrder}`;
      if (seriesPositions.has(positionKey)) {
        throw new Error(
          `Duplicate series position ${post.series} #${post.seriesOrder} in ${seriesPositions.get(positionKey)} and ${post.fileName}`
        );
      }
      seriesPositions.set(positionKey, post.fileName);
    }
  }

  return posts;
}
