export interface BlogPost {
  id: string;
  slug?: string;
  fileName?: string;
  title: string;
  excerpt: string;
  date: string;
  updatedDate?: string;
  readTime: string;
  wordCount?: number;
  author?: string;
  tags: string[];
  category?: string;
  platform?: string;
  tools?: string[];
  playlist?: string;
  playlistSlug?: string;
  playlistOrder?: number;
  playlistOnly?: boolean;
  /** Legacy aliases accepted while old generated indexes are being replaced. */
  series?: string;
  seriesSlug?: string;
  seriesOrder?: number;
  difficulty?: string;
  featured?: boolean;
  image?: string;
  canonicalUrl?: string;
  searchText?: string;
  headings?: BlogHeading[];
  content: string;
}

export interface BlogHeading {
  id: string;
  text: string;
  level: number;
  line?: number;
}
