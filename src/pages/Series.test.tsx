import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter, Route, Routes } from "react-router-dom";

import Series from "./Series";
import { type BlogPost } from "@/types/blog";
import { loadMarkdownPosts } from "@/utils/markdownLoader";

vi.mock("@/utils/markdownLoader", () => ({
  loadMarkdownPosts: vi.fn(),
}));

const posts: BlogPost[] = [
  {
    id: "part-two",
    title: "Configure the Production Policy",
    excerpt: "A detailed second part about production policy configuration.",
    date: "2026-01-02",
    readTime: "8 min read",
    tags: ["GCP", "Security"],
    category: "Security",
    platform: "GCP",
    playlist: "Production GCP Security",
    playlistSlug: "production-gcp-security",
    playlistOrder: 2,
    playlistOnly: true,
    content: "content",
  },
  {
    id: "part-one",
    title: "Define the Security Boundary",
    excerpt: "A detailed first part about defining a security boundary.",
    date: "2026-01-01",
    readTime: "6 min read",
    tags: ["GCP", "Security"],
    category: "Security",
    platform: "GCP",
    playlist: "Production GCP Security",
    playlistSlug: "production-gcp-security",
    playlistOrder: 1,
    content: "content",
  },
];

const renderRoute = (slug: string) => render(
  <MemoryRouter initialEntries={[`/playlists/${slug}`]}>
    <Routes>
      <Route path="/playlists/:playlistSlug" element={<Series />} />
      <Route path="/blog" element={<div>Blog landing</div>} />
    </Routes>
  </MemoryRouter>
);

describe("Playlist page", () => {
  it("renders only matching posts in explicit playlist order", async () => {
    vi.mocked(loadMarkdownPosts).mockResolvedValue(posts);
    renderRoute("production-gcp-security");

    await waitFor(() => expect(screen.getByRole("heading", { name: "Production GCP Security" })).toBeInTheDocument());

    const links = screen.getAllByRole("link").filter(link => link.getAttribute("href")?.startsWith("/blog/"));
    expect(links.map(link => link.getAttribute("href"))).toEqual(["/blog/part-one", "/blog/part-two"]);
    expect(screen.getByText("01")).toBeInTheDocument();
    expect(screen.getByText("02")).toBeInTheDocument();
    expect(screen.getByText("Playlist-first guide")).toBeInTheDocument();
    expect(screen.getByText(/independently readable, tagged, and searchable/)).toBeInTheDocument();
  });

  it("searches only within the selected playlist", async () => {
    vi.mocked(loadMarkdownPosts).mockResolvedValue(posts);
    renderRoute("production-gcp-security");

    await waitFor(() => expect(screen.getByText("Define the Security Boundary")).toBeInTheDocument());
    fireEvent.change(screen.getByPlaceholderText("Search within this playlist"), { target: { value: "policy configuration" } });

    expect(screen.queryByText("Define the Security Boundary")).not.toBeInTheDocument();
    expect(screen.getByText("Configure the Production Policy")).toBeInTheDocument();
  });

  it("renders large playlists progressively in groups of twenty", async () => {
    const largePlaylist = Array.from({ length: 25 }, (_, index) => ({
      ...posts[0],
      id: `item-${index + 1}`,
      title: `Playlist Article ${index + 1}`,
      playlistOrder: index + 1,
    }));
    vi.mocked(loadMarkdownPosts).mockResolvedValue(largePlaylist);
    renderRoute("production-gcp-security");

    await waitFor(() => expect(screen.getByText("Playlist Article 1")).toBeInTheDocument());
    expect(screen.queryByText("Playlist Article 21")).not.toBeInTheDocument();
    fireEvent.click(screen.getByRole("button", { name: "Load 20 more" }));
    expect(screen.getByText("Playlist Article 25")).toBeInTheDocument();
  });

  it("redirects an unknown playlist to the blog", async () => {
    vi.mocked(loadMarkdownPosts).mockResolvedValue(posts);
    renderRoute("missing-playlist");

    await waitFor(() => expect(screen.getByText("Blog landing")).toBeInTheDocument());
  });
});
