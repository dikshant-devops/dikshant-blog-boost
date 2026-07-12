import { describe, expect, it, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
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
    series: "Production GCP Security",
    seriesSlug: "production-gcp-security",
    seriesOrder: 2,
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
    series: "Production GCP Security",
    seriesSlug: "production-gcp-security",
    seriesOrder: 1,
    content: "content",
  },
];

const renderRoute = (slug: string) => render(
  <MemoryRouter initialEntries={[`/series/${slug}`]}>
    <Routes>
      <Route path="/series/:seriesSlug" element={<Series />} />
      <Route path="/blog" element={<div>Blog landing</div>} />
    </Routes>
  </MemoryRouter>
);

describe("Series page", () => {
  it("renders only matching posts in explicit series order", async () => {
    vi.mocked(loadMarkdownPosts).mockResolvedValue(posts);
    renderRoute("production-gcp-security");

    await waitFor(() => expect(screen.getByRole("heading", { name: "Production GCP Security" })).toBeInTheDocument());

    const links = screen.getAllByRole("link").filter(link => link.getAttribute("href")?.startsWith("/blog/"));
    expect(links.map(link => link.getAttribute("href"))).toEqual(["/blog/part-one", "/blog/part-two"]);
    expect(screen.getByText("Part 1")).toBeInTheDocument();
    expect(screen.getByText("Part 2")).toBeInTheDocument();
  });

  it("redirects an unknown series to the blog", async () => {
    vi.mocked(loadMarkdownPosts).mockResolvedValue(posts);
    renderRoute("missing-series");

    await waitFor(() => expect(screen.getByText("Blog landing")).toBeInTheDocument());
  });
});
