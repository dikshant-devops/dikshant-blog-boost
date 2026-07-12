import type { BlogPost } from "@/types/blog";

export interface BlogSearchIndex {
  version: 1;
  documents: Array<{ id: string; terms: string; boost: string }>;
}

const STOP_WORDS = new Set([
  "a", "an", "and", "are", "as", "at", "be", "by", "for", "from", "has", "have", "how",
  "in", "into", "is", "it", "of", "on", "or", "that", "the", "their", "this", "to",
  "use", "using", "was", "what", "when", "where", "which", "will", "with", "your",
]);

function stem(token: string) {
  if (token.length > 8 && token.endsWith("ations")) return `${token.slice(0, -6)}ate`;
  if (token.length > 8 && token.endsWith("ments")) return token.slice(0, -5);
  if (token.length > 6 && token.endsWith("ings")) return token.slice(0, -4);
  if (token.length > 7 && token.endsWith("ation")) return `${token.slice(0, -5)}ate`;
  if (token.length > 6 && token.endsWith("ment")) return token.slice(0, -4);
  if (token.length > 5 && token.endsWith("ies")) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && token.endsWith("ing")) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith("ed")) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith("es")) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith("s")) return token.slice(0, -1);
  return token;
}

export function tokenizeSearchQuery(value: string) {
  const matches = value.toLowerCase().match(/[a-z0-9]+/g) || [];
  return [...new Set(matches
    .filter(token => token.length > 1 && !STOP_WORDS.has(token))
    .map(stem))];
}

function metadataTokens(post: BlogPost) {
  return new Set(tokenizeSearchQuery([
    post.title,
    post.excerpt,
    post.category,
    post.platform,
    post.playlist,
    ...(post.tags || []),
    ...(post.tools || []),
  ].filter(Boolean).join(" ")));
}

export function rankBlogPosts(posts: BlogPost[], index: BlogSearchIndex | null, query: string) {
  const queryTokens = tokenizeSearchQuery(query);
  if (!queryTokens.length) return new Map(posts.map(post => [post.id, 0]));

  const indexedDocuments = new Map((index?.documents || []).map(document => [document.id, {
    terms: new Set(document.terms.split(' ').filter(Boolean)),
    boost: new Set(document.boost.split(' ').filter(Boolean)),
  }]));
  const metadataById = new Map(posts.map(post => [post.id, metadataTokens(post)]));
  const scoresByToken = queryTokens.map(token => {
    const scores = new Map<string, number>();

    posts.forEach(post => {
      const indexed = indexedDocuments.get(post.id);
      if (metadataById.get(post.id)?.has(token) || indexed?.boost.has(token)) scores.set(post.id, 6);
      else if (indexed?.terms.has(token)) scores.set(post.id, 1);
    });
    return scores;
  });

  const results = new Map<string, number>();
  for (const [id, firstScore] of scoresByToken[0]) {
    let score = firstScore;
    let matchesAll = true;
    for (const tokenScores of scoresByToken.slice(1)) {
      const tokenScore = tokenScores.get(id);
      if (!tokenScore) {
        matchesAll = false;
        break;
      }
      score += tokenScore;
    }
    if (matchesAll) {
      const post = posts.find(candidate => candidate.id === id);
      if (post?.title.toLowerCase().includes(query.trim().toLowerCase())) score += 12;
      results.set(id, score);
    }
  }
  return results;
}
