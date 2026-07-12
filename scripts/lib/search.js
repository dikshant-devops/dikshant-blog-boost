const STOP_WORDS = new Set([
  'a', 'an', 'and', 'are', 'as', 'at', 'be', 'by', 'for', 'from', 'has', 'have', 'how',
  'in', 'into', 'is', 'it', 'of', 'on', 'or', 'that', 'the', 'their', 'this', 'to',
  'use', 'using', 'was', 'what', 'when', 'where', 'which', 'will', 'with', 'your'
]);

function stem(token) {
  if (token.length > 8 && token.endsWith('ations')) return `${token.slice(0, -6)}ate`;
  if (token.length > 8 && token.endsWith('ments')) return token.slice(0, -5);
  if (token.length > 6 && token.endsWith('ings')) return token.slice(0, -4);
  if (token.length > 7 && token.endsWith('ation')) return `${token.slice(0, -5)}ate`;
  if (token.length > 6 && token.endsWith('ment')) return token.slice(0, -4);
  if (token.length > 5 && token.endsWith('ies')) return `${token.slice(0, -3)}y`;
  if (token.length > 5 && token.endsWith('ing')) return token.slice(0, -3);
  if (token.length > 4 && token.endsWith('ed')) return token.slice(0, -2);
  if (token.length > 4 && token.endsWith('es')) return token.slice(0, -2);
  if (token.length > 3 && token.endsWith('s')) return token.slice(0, -1);
  return token;
}

export function tokenizeForSearch(value) {
  const matches = String(value || '').toLowerCase().match(/[a-z0-9]+/g) || [];
  return [...new Set(matches
    .filter(token => token.length > 1 && !STOP_WORDS.has(token))
    .map(stem))];
}

export function buildSearchIndex(posts) {
  const sampleEvenly = (tokens, limit = 180) => {
    if (tokens.length <= limit) return tokens;
    return Array.from({ length: limit }, (_, index) => tokens[
      Math.floor(index * (tokens.length - 1) / (limit - 1))
    ]);
  };

  const documents = posts.map(post => ({
    id: post.id,
    terms: sampleEvenly(tokenizeForSearch(post.searchText)).join(' '),
    boost: tokenizeForSearch([
      post.title,
      post.excerpt,
      post.category,
      post.platform,
      post.playlist,
      ...(post.tags || []),
      ...(post.tools || []),
      ...(post.headings || []).map(heading => heading.text),
    ].join(' ')).join(' '),
  }));

  return { version: 1, documents };
}
