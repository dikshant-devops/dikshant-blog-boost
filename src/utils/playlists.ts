import { type BlogPost } from "@/types/blog";

export const PLAYLIST_PLATFORMS = ["GCP", "AWS", "Kubernetes"] as const;

export type PlaylistPlatform = typeof PLAYLIST_PLATFORMS[number];

export type PlaylistCollection = {
  name: string;
  slug: string;
  platform: PlaylistPlatform;
  posts: BlogPost[];
};

const isPlaylistPlatform = (value: string): value is PlaylistPlatform =>
  PLAYLIST_PLATFORMS.includes(value as PlaylistPlatform);

export const collectPlaylists = (posts: BlogPost[]): PlaylistCollection[] => {
  const collections = new Map<string, PlaylistCollection>();

  posts.forEach(post => {
    const name = post.playlist || post.series || "";
    const slug = post.playlistSlug || post.seriesSlug || "";
    const platform = post.platform || post.tags.find(isPlaylistPlatform) || "";
    if (!name || !slug || !isPlaylistPlatform(platform)) return;

    const existing = collections.get(slug) || { name, slug, platform, posts: [] };
    existing.posts.push(post);
    collections.set(slug, existing);
  });

  return Array.from(collections.values())
    .map(collection => ({
      ...collection,
      posts: collection.posts.sort((a, b) =>
        (a.playlistOrder ?? a.seriesOrder ?? Number.MAX_SAFE_INTEGER)
        - (b.playlistOrder ?? b.seriesOrder ?? Number.MAX_SAFE_INTEGER)
        || new Date(a.date).getTime() - new Date(b.date).getTime()
        || a.title.localeCompare(b.title)
      )
    }))
    .sort((a, b) =>
      PLAYLIST_PLATFORMS.indexOf(a.platform) - PLAYLIST_PLATFORMS.indexOf(b.platform)
      || a.name.localeCompare(b.name)
    );
};

export const supportsPlaylists = (tag: string): tag is PlaylistPlatform => isPlaylistPlatform(tag);
