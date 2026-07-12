import { useCallback, useEffect, useMemo, useState } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { ArrowRight, Boxes, ChevronDown, Cloud, Code2, FileText, ListVideo, Search, SlidersHorizontal, Tag as TagIcon, Wrench, X, type LucideIcon } from "lucide-react";

import { BlogCard } from "@/components/BlogCard";
import { BlogCardSkeleton } from "@/components/BlogCardSkeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getOrderedTagGroups } from "@/config/tags";
import { useCollectionStructuredData, useSEO } from "@/hooks/useSEO";
import { type BlogPost } from "@/types/blog";
import { loadBlogSearchIndex, loadMarkdownPosts } from "@/utils/markdownLoader";
import { collectPlaylists, type PlaylistCollection, supportsPlaylists } from "@/utils/playlists";
import { rankBlogPosts, type BlogSearchIndex } from "@/utils/blogSearch";

const ARTICLE_PAGE_SIZE = 12;
const PLAYLIST_DISCOVERY_LIMIT = 6;

const TOPIC_GROUP_ICONS: Record<string, LucideIcon> = {
  core: Boxes,
  platforms: Cloud,
  tools: Wrench,
  development: Code2,
  other: TagIcon,
};

const PlaylistCard = ({ playlist }: { playlist: PlaylistCollection }) => (
  <article className="group flex min-h-64 flex-col rounded-md border bg-card p-5 transition-colors hover:border-primary">
    <div className="flex items-center justify-between gap-4">
      <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-background text-primary">
        <ListVideo className="h-5 w-5" />
      </span>
      <Badge variant="outline">{playlist.platform}</Badge>
    </div>
    <h3 className="mt-5 text-xl font-semibold group-hover:text-primary">{playlist.name}</h3>
    <p className="mt-2 text-sm text-muted-foreground">
      {playlist.posts.length} ordered {playlist.posts.length === 1 ? "article" : "articles"}
    </p>
    <div className="mt-4 border-t pt-4">
      <p className="text-xs font-semibold uppercase text-muted-foreground" style={{ letterSpacing: "0.08em" }}>Start here</p>
      <p className="mt-1 line-clamp-2 text-sm font-medium">01. {playlist.posts[0]?.title}</p>
      {playlist.posts.length > 1 && (
        <p className="mt-2 line-clamp-1 text-xs text-muted-foreground">
          Next: {playlist.posts[1].title}
        </p>
      )}
    </div>
    <Link to={`/playlists/${playlist.slug}`} className="mt-auto flex items-center justify-between border-t pt-4 text-sm font-semibold text-primary">
      Open playlist <ArrowRight className="h-4 w-4" />
    </Link>
  </article>
);

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState(() => searchParams.get("tag") || "");
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchIndex, setSearchIndex] = useState<BlogSearchIndex | null>(null);
  const [loading, setLoading] = useState(true);
  const [topicsExpanded, setTopicsExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(ARTICLE_PAGE_SIZE);

  useSEO({
    title: "DevOps Field Notes | Tech With Dikshant",
    description: "Practical field notes on GCP, AWS, Kubernetes, Docker, GitHub Actions, networking, and reliability, with commands, tradeoffs, and verification steps.",
    keywords: "DevOps field notes, GCP, AWS, Kubernetes, Docker, GitHub Actions, networking, site reliability engineering",
    type: "website",
    url: `${window.location.origin}/blog`,
    robots: "index, follow"
  });

  useEffect(() => {
    loadMarkdownPosts()
      .then(markdownPosts => {
        setPosts(markdownPosts.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()));
      })
      .catch(error => console.error("Error loading posts:", error))
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) return;
    let active = true;
    loadBlogSearchIndex()
      .then(index => {
        if (active) setSearchIndex(index);
      })
      .catch(error => console.warn("Full-text blog search is unavailable:", error));
    return () => { active = false; };
  }, [searchTerm]);

  useEffect(() => {
    setSelectedTag(searchParams.get("tag") || "");
    setVisibleCount(ARTICLE_PAGE_SIZE);
  }, [searchParams]);

  const playlists = useMemo(() => collectPlaylists(posts), [posts]);
  const listingPosts = useMemo(() => posts.filter(post => !post.playlistOnly), [posts]);
  const selectedPlaylists = useMemo(() => supportsPlaylists(selectedTag)
    ? playlists.filter(playlist => playlist.platform === selectedTag)
    : [], [playlists, selectedTag]);
  const isPlaylistView = supportsPlaylists(selectedTag) && searchParams.get("view") === "playlists" && !searchTerm;

  const clearFilters = useCallback(() => {
    setSelectedTag("");
    setSearchTerm("");
    setTopicsExpanded(false);
    setVisibleCount(ARTICLE_PAGE_SIZE);
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleSelectTag = useCallback((tag: string) => {
    setSelectedTag(tag);
    setSearchTerm("");
    setTopicsExpanded(false);
    setVisibleCount(ARTICLE_PAGE_SIZE);
    setSearchParams(tag ? { tag } : {}, { replace: true });
  }, [setSearchParams]);

  const handleSearch = useCallback((value: string) => {
    setSearchTerm(value);
    setVisibleCount(ARTICLE_PAGE_SIZE);
    if (searchParams.get("view") === "playlists") {
      setSearchParams(selectedTag ? { tag: selectedTag } : {}, { replace: true });
    }
  }, [searchParams, selectedTag, setSearchParams]);

  const handleView = useCallback((view: "articles" | "playlists") => {
    if (!supportsPlaylists(selectedTag)) return;
    setSearchTerm("");
    setVisibleCount(ARTICLE_PAGE_SIZE);
    setSearchParams(view === "playlists" ? { tag: selectedTag, view } : { tag: selectedTag }, { replace: true });
  }, [selectedTag, setSearchParams]);

  const allTags = useMemo(() => Array.from(new Set(listingPosts.flatMap(post => post.tags))).sort(), [listingPosts]);
  const tagGroups = useMemo(() => getOrderedTagGroups(allTags), [allTags]);
  const tagCounts = useMemo(() => listingPosts.reduce<Record<string, number>>((counts, post) => {
    post.tags.forEach(tag => {
      counts[tag] = (counts[tag] || 0) + 1;
    });
    return counts;
  }, {}), [listingPosts]);

  const searchScores = useMemo(() => rankBlogPosts(posts, searchIndex, searchTerm), [posts, searchIndex, searchTerm]);
  const filteredPosts = useMemo(() => {
    const isSearchResult = Boolean(searchTerm.trim());
    return posts
      .filter(post => (isSearchResult || !post.playlistOnly)
        && searchScores.has(post.id)
        && (!selectedTag || post.tags.includes(selectedTag)))
      .sort((left, right) => isSearchResult
        ? (searchScores.get(right.id) || 0) - (searchScores.get(left.id) || 0)
        : new Date(right.date).getTime() - new Date(left.date).getTime());
  }, [posts, searchScores, searchTerm, selectedTag]);

  const isUnfiltered = !selectedTag && !searchTerm;
  const visiblePosts = filteredPosts.slice(0, visibleCount);

  useCollectionStructuredData({
    name: "DevOps field notes",
    description: "Practical DevOps tutorials covering cloud platforms, delivery automation, networking, security, and containers.",
    url: `${window.location.origin}/blog`,
    items: listingPosts.map(post => ({ name: post.title, url: `${window.location.origin}/blog/${post.id}` })),
  }, "blog-listing");

  return (
    <div className="content-shell py-10 md:py-14">
      <header className="grid gap-6 border-b pb-8 md:grid-cols-[1fr_auto] md:items-end">
        <div>
          <p className="eyebrow">Implementation library</p>
          <h1 className="mt-2 text-3xl font-bold md:text-5xl">DevOps field notes</h1>
          <p className="mt-4 max-w-2xl text-base text-muted-foreground md:text-lg">
            Cloud infrastructure, delivery pipelines, networking, and container operations explained through practical engineering work.
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          <span className="font-semibold text-foreground">{posts.length}</span> searchable {posts.length === 1 ? "article" : "articles"}
          {posts.length !== listingPosts.length && <> · <span className="font-semibold text-foreground">{listingPosts.length}</span> in main feed</>}
        </div>
      </header>

      <section id="topics" aria-labelledby="topic-browser-heading" className="border-b py-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="eyebrow">Find the right field note</p>
            <h2 id="topic-browser-heading" className="mt-2 text-xl font-semibold md:text-2xl">Browse by area</h2>
            <p className="mt-1 text-sm text-muted-foreground">Move from an engineering concern to a platform, then narrow by the tool in use.</p>
          </div>
          <div className="relative w-full lg:max-w-xl">
            <Search className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search commands, tools, providers, or article text"
              value={searchTerm}
              onChange={event => handleSearch(event.target.value)}
              className="h-12 bg-card pl-10 pr-4 text-sm shadow-sm"
            />
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          size="sm"
          className="topic-mobile-toggle mt-5 h-auto min-h-12 w-full justify-between px-4 py-3 text-left md:hidden"
          aria-expanded={topicsExpanded}
          aria-controls="topic-groups"
          onClick={() => setTopicsExpanded(expanded => !expanded)}
        >
          <span className="flex min-w-0 items-center gap-3">
            <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md border bg-background">
              <SlidersHorizontal className="h-4 w-4" />
            </span>
            <span className="min-w-0">
              <span className="block text-sm font-semibold">Browse topics</span>
              <span className="block text-xs font-normal text-muted-foreground">{allTags.length} topics across {tagGroups.length} areas</span>
            </span>
          </span>
          <ChevronDown className={`h-4 w-4 shrink-0 transition-transform ${topicsExpanded ? "rotate-180" : ""}`} />
        </Button>

        <div id="topic-groups" className={`${topicsExpanded ? "grid" : "hidden"} mt-6 gap-3 sm:grid-cols-2 md:grid lg:grid-cols-4`}>
          {tagGroups.map(group => {
            const GroupIcon = TOPIC_GROUP_ICONS[group.key] || TagIcon;
            return (
            <div key={group.title} className="topic-filter-group" data-topic-tone={group.key} role="group" aria-labelledby={`topic-group-${group.key}`}>
              <div className="flex items-start gap-3">
                <span className="topic-group-icon" aria-hidden="true"><GroupIcon className="h-4 w-4" /></span>
                <div className="min-w-0">
                  <h3 id={`topic-group-${group.key}`} className="text-sm font-semibold">{group.title}</h3>
                  <p className="mt-0.5 text-xs leading-5 text-muted-foreground">{group.description}</p>
                </div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                {group.tags.map(tag => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => handleSelectTag(tag)}
                    aria-label={tag}
                    aria-pressed={selectedTag === tag}
                    className="topic-filter-button"
                  >
                    <span>{tag}</span>
                    <span className="topic-filter-count" aria-hidden="true">{tagCounts[tag] || 0}</span>
                  </button>
                ))}
              </div>
            </div>
          )})}
        </div>

        <div className="mt-6 flex min-h-9 flex-wrap items-center justify-between gap-3 border-t pt-4 text-sm text-muted-foreground">
          <span aria-live="polite">{isPlaylistView ? `${selectedPlaylists.length} ${selectedPlaylists.length === 1 ? "playlist" : "playlists"}` : `Showing ${Math.min(visibleCount, filteredPosts.length)} of ${filteredPosts.length} matching articles`}</span>
          {(selectedTag || searchTerm) && (
            <Button variant="ghost" size="sm" onClick={clearFilters}>
              <X className="mr-2 h-4 w-4" /> Clear filters
            </Button>
          )}
        </div>
      </section>

      {supportsPlaylists(selectedTag) && (
        <nav aria-label={`${selectedTag} content views`} className="flex gap-2 border-b py-5">
          <Button variant={isPlaylistView ? "ghost" : "secondary"} onClick={() => handleView("articles")}>
            <FileText className="mr-2 h-4 w-4" /> Articles <span className="ml-2 text-xs text-muted-foreground">{filteredPosts.length}</span>
          </Button>
          <Button variant={isPlaylistView ? "secondary" : "ghost"} onClick={() => handleView("playlists")}>
            <ListVideo className="mr-2 h-4 w-4" /> Playlists <span className="ml-2 text-xs text-muted-foreground">{selectedPlaylists.length}</span>
          </Button>
        </nav>
      )}

      {!loading && isUnfiltered && playlists.length > 0 && (
        <section aria-labelledby="playlist-discovery-heading" className="border-b py-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                <ListVideo className="h-5 w-5" /> Curated collections
              </div>
              <h2 id="playlist-discovery-heading" className="text-2xl font-semibold">Playlists</h2>
              <p className="mt-2 text-sm text-muted-foreground">Ordered collections with explicit membership and independent article URLs.</p>
            </div>
          </div>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {playlists.slice(0, PLAYLIST_DISCOVERY_LIMIT).map(playlist => <PlaylistCard key={playlist.slug} playlist={playlist} />)}
          </div>
        </section>
      )}

      {isPlaylistView ? (
        <section aria-labelledby="platform-playlists-heading" className="py-10">
          <div className="mb-8">
            <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
              <ListVideo className="h-4 w-4" /> {selectedTag} collections
            </div>
            <h2 id="platform-playlists-heading" className="text-2xl font-bold">{selectedTag} playlists</h2>
            <p className="mt-2 text-sm text-muted-foreground">Only explicitly assigned articles appear inside each playlist.</p>
          </div>
          {selectedPlaylists.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {selectedPlaylists.map(playlist => <PlaylistCard key={playlist.slug} playlist={playlist} />)}
            </div>
          ) : (
            <div className="border-y py-14 text-center">
              <p className="font-medium">No {selectedTag} playlists have been published yet</p>
              <p className="mt-2 text-sm text-muted-foreground">The existing {selectedTag} articles are still available individually.</p>
              <Button variant="outline" className="mt-5" onClick={() => handleView("articles")}>View {selectedTag} articles</Button>
            </div>
          )}
        </section>
      ) : (
        <section aria-labelledby="article-collection-heading" className="py-10">
          {selectedTag && (
            <div className="mb-8 flex flex-wrap items-end justify-between gap-4">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                  <TagIcon className="h-4 w-4" /> Selected topic
                </div>
                <h2 id="article-collection-heading" className="text-2xl font-bold">{selectedTag} articles</h2>
                <p className="mt-2 text-sm text-muted-foreground">Default articles for this topic. Playlist-only entries remain available through playlists and keyword search.</p>
              </div>
              <Badge variant="secondary">{filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}</Badge>
            </div>
          )}
          {!selectedTag && <h2 id="article-collection-heading" className="sr-only">All articles</h2>}

          {loading ? (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {Array.from({ length: 6 }, (_, index) => <BlogCardSkeleton key={index} />)}
            </div>
          ) : filteredPosts.length === 0 ? (
            <div className="border-y py-16 text-center">
              <p className="text-lg font-medium">No matching articles</p>
              <p className="mt-2 text-sm text-muted-foreground">Try a different term or clear the active filters.</p>
              <Button variant="outline" className="mt-5" onClick={clearFilters}>Show all articles</Button>
            </div>
          ) : isUnfiltered ? (
            <div className="space-y-8">
              <BlogCard post={visiblePosts[0]} variant="featured" />
              <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
                {visiblePosts.slice(1).map(post => <BlogCard key={post.id} post={post} />)}
              </div>
            </div>
          ) : (
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              {visiblePosts.map(post => <BlogCard key={post.id} post={post} />)}
            </div>
          )}

          {visibleCount < filteredPosts.length && (
            <Button variant="outline" className="mt-8 w-full" onClick={() => setVisibleCount(count => count + ARTICLE_PAGE_SIZE)}>
              Load 12 more articles
            </Button>
          )}
        </section>
      )}
    </div>
  );
};

export default Blog;
