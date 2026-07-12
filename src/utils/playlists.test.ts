import { describe, expect, it } from "vitest";

import { type BlogPost } from "@/types/blog";
import { collectPlaylists, supportsPlaylists } from "./playlists";

const basePost: BlogPost = {
  id: "base",
  title: "Base article",
  excerpt: "Base excerpt",
  date: "2026-01-01",
  readTime: "4 min read",
  tags: ["GCP"],
  platform: "GCP",
  content: "",
};

describe("playlist collections", () => {
  it("groups only explicitly assigned posts and preserves playlist order", () => {
    const posts: BlogPost[] = [
      { ...basePost, id: "standalone", title: "Standalone" },
      { ...basePost, id: "second", title: "Second", playlist: "GCP Operations", playlistSlug: "gcp-operations", playlistOrder: 2 },
      { ...basePost, id: "first", title: "First", playlist: "GCP Operations", playlistSlug: "gcp-operations", playlistOrder: 1 },
    ];

    const playlists = collectPlaylists(posts);
    expect(playlists).toHaveLength(1);
    expect(playlists[0].posts.map(post => post.id)).toEqual(["first", "second"]);
    expect(playlists[0].posts.some(post => post.id === "standalone")).toBe(false);
  });

  it("accepts legacy series fields during migration", () => {
    const playlists = collectPlaylists([{
      ...basePost,
      series: "Legacy GCP Series",
      seriesSlug: "legacy-gcp-series",
      seriesOrder: 1,
    }]);

    expect(playlists[0].name).toBe("Legacy GCP Series");
  });

  it("limits playlist tabs to the supported platforms", () => {
    expect(supportsPlaylists("GCP")).toBe(true);
    expect(supportsPlaylists("AWS")).toBe(true);
    expect(supportsPlaylists("Kubernetes")).toBe(true);
    expect(supportsPlaylists("Docker")).toBe(false);
  });
});
