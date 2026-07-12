import { useEffect, useMemo, useState } from "react";
import { Navigate, Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, Clock, ListVideo, Search } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { useCollectionStructuredData, useSEO } from "@/hooks/useSEO";
import { type BlogPost } from "@/types/blog";
import { loadMarkdownPosts } from "@/utils/markdownLoader";
import { collectPlaylists } from "@/utils/playlists";

const PLAYLIST_PAGE_SIZE = 20;

const Series = () => {
  const { playlistSlug = "", seriesSlug = "" } = useParams();
  const slug = playlistSlug || seriesSlug;
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [visibleCount, setVisibleCount] = useState(PLAYLIST_PAGE_SIZE);

  const playlist = useMemo(() => collectPlaylists(posts).find(item => item.slug === slug), [posts, slug]);
  const filteredPosts = useMemo(() => {
    if (!playlist) return [];
    const query = searchTerm.trim().toLowerCase();
    if (!query) return playlist.posts;
    return playlist.posts.filter(post => [
      post.title,
      post.excerpt,
      post.category,
      post.platform,
      ...(post.tags || []),
      ...(post.tools || []),
    ].filter(Boolean).join(" ").toLowerCase().includes(query));
  }, [playlist, searchTerm]);

  useSEO(playlist ? {
    title: `${playlist.name} Playlist | Tech With Dikshant`,
    description: `Browse ${playlist.posts.length} ordered ${playlist.posts.length === 1 ? "article" : "articles"} in the ${playlist.name} ${playlist.platform} playlist.`,
    keywords: playlist.posts.flatMap(post => post.tags).filter((tag, index, tags) => tags.indexOf(tag) === index).join(", "),
    type: "website",
    url: `${window.location.origin}/playlists/${slug}`,
    robots: "index, follow",
  } : null);

  useCollectionStructuredData(playlist ? {
    name: playlist.name,
    description: `Browse ${playlist.posts.length} ordered ${playlist.posts.length === 1 ? "article" : "articles"} in the ${playlist.name} ${playlist.platform} playlist.`,
    url: `${window.location.origin}/playlists/${slug}`,
    items: playlist.posts.map(post => ({ name: post.title, url: `${window.location.origin}/blog/${post.id}` })),
  } : null, "playlist");

  useEffect(() => {
    let active = true;
    loadMarkdownPosts()
      .then(allPosts => {
        if (active) setPosts(allPosts);
      })
      .catch(error => console.error("Error loading playlist:", error))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setVisibleCount(PLAYLIST_PAGE_SIZE);
  }, [searchTerm, slug]);

  if (loading) {
    return (
      <div className="content-shell max-w-5xl py-10 md:py-16">
        <Skeleton className="mb-8 h-9 w-32" />
        <Skeleton className="mb-3 h-12 w-2/3" />
        <Skeleton className="mb-10 h-5 w-1/2" />
        <div className="space-y-3">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!playlist) return <Navigate to="/blog" replace />;

  const visiblePosts = filteredPosts.slice(0, visibleCount);
  const backUrl = `/blog?tag=${encodeURIComponent(playlist.platform)}&view=playlists`;

  return (
    <div className="content-shell max-w-5xl py-10 md:py-16">
      <Button variant="ghost" asChild className="mb-8">
        <Link to={backUrl}>
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to {playlist.platform} playlists
        </Link>
      </Button>

      <header className="grid gap-8 border-b pb-10 md:grid-cols-[1fr_17rem] md:items-end">
        <div>
          <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
            <ListVideo className="h-4 w-4" />
            Playlist
          </div>
          <div className="mb-4 flex flex-wrap gap-2">
            <Badge variant="outline">{playlist.platform}</Badge>
            <Badge variant="secondary">{playlist.posts.length} {playlist.posts.length === 1 ? "article" : "articles"}</Badge>
          </div>
          <h1 className="text-3xl font-bold md:text-5xl">{playlist.name}</h1>
          <p className="mt-4 max-w-2xl text-muted-foreground">
            An ordered collection of explicitly selected articles. Every article also remains independently readable, tagged, and searchable.
          </p>
        </div>
        <div className="rounded-md border bg-card p-4">
          <p className="text-xs font-semibold uppercase text-muted-foreground" style={{ letterSpacing: "0.08em" }}>Playlist scope</p>
          <p className="mt-2 text-sm">Only articles assigned by the author appear here.</p>
        </div>
      </header>

      <section className="py-8" aria-label="Search this playlist">
        <div className="relative max-w-xl">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <Input
            value={searchTerm}
            onChange={event => setSearchTerm(event.target.value)}
            placeholder="Search within this playlist"
            className="h-11 bg-card pl-10"
          />
        </div>
        <p className="mt-3 text-sm text-muted-foreground">
          Showing {visiblePosts.length} of {filteredPosts.length} matching {filteredPosts.length === 1 ? "article" : "articles"}
        </p>
      </section>

      {filteredPosts.length === 0 ? (
        <div className="border-y py-14 text-center">
          <p className="font-medium">No matching articles in this playlist</p>
          <Button variant="outline" className="mt-4" onClick={() => setSearchTerm("")}>Clear search</Button>
        </div>
      ) : (
        <ol className="divide-y border-y">
          {visiblePosts.map((post, index) => {
            const position = post.playlistOrder ?? post.seriesOrder ?? index + 1;
            return (
              <li key={post.id}>
                <Link
                  to={`/blog/${post.id}`}
                  className="group grid gap-4 py-5 transition-colors hover:bg-muted/30 sm:grid-cols-[3.5rem_minmax(0,1fr)_auto] sm:items-center sm:px-4"
                >
                  <span className="font-mono text-sm text-muted-foreground">{String(position).padStart(2, "0")}</span>
                  <span className="min-w-0">
                    <span className="block text-lg font-semibold group-hover:text-primary">{post.title}</span>
                    <span className="mt-1 line-clamp-2 block text-sm text-muted-foreground">{post.excerpt}</span>
                    <span className="mt-3 flex flex-wrap gap-4 text-xs text-muted-foreground">
                      <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{post.date}</span>
                      <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.readTime}</span>
                      {post.playlistOnly && <Badge variant="outline" className="h-5">Playlist-first guide</Badge>}
                    </span>
                  </span>
                  <ArrowRight className="hidden h-5 w-5 text-muted-foreground group-hover:text-primary sm:block" />
                </Link>
              </li>
            );
          })}
        </ol>
      )}

      {visibleCount < filteredPosts.length && (
        <Button variant="outline" className="mt-6 w-full" onClick={() => setVisibleCount(count => count + PLAYLIST_PAGE_SIZE)}>
          Load 20 more
        </Button>
      )}
    </div>
  );
};

export default Series;
