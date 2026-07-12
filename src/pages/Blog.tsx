
import { BlogCard } from "@/components/BlogCard";
import { BlogCardSkeleton } from "@/components/BlogCardSkeleton";
import { BlogPost } from "@/types/blog";
import { loadBlogSearchIndex, loadMarkdownPosts } from "@/utils/markdownLoader";
import { useState, useEffect, useMemo, useCallback } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { getOrderedTagGroups } from "@/config/tags";
import { ArrowRight, ListOrdered, Search, Tag as TagIcon, X } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const legacySeriesToTag = (series: string | null) => {
  if (!series) return "";
  if (series.includes("GCP")) return "GCP";
  if (series.includes("AWS")) return "AWS";
  if (series.includes("Azure")) return "Azure";
  if (series.includes("CI/CD")) return "CI/CD";
  return "";
};

const hasSeries = (post: BlogPost) => Boolean(post.series?.trim());

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState(() => searchParams.get("tag") || legacySeriesToTag(searchParams.get("series")));
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [searchIndex, setSearchIndex] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);

  // SEO optimization for the blog listing page
  useSEO({
    title: "DevOps Blog - Tutorials & Best Practices | Tech With Dikshant",
    description: "Explore comprehensive DevOps tutorials covering Docker, Kubernetes, CI/CD, cloud technologies, and automation best practices.",
    keywords: "DevOps blog, Docker tutorials, Kubernetes guide, CI/CD pipeline, cloud computing, automation, DevOps best practices",
    type: "website",
    url: `${window.location.origin}/blog`,
    robots: "index, follow"
  });

  // Load blog posts on component mount
  useEffect(() => {
    const loadAllPosts = async () => {
      try {
        // Load only markdown posts - this is the primary content source
        const markdownPosts = await loadMarkdownPosts();
        
        // Sort by date (newest first)
        const sortedPosts = markdownPosts.sort((a, b) => 
          new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        
        setPosts(sortedPosts);
      } catch (error) {
        console.error('Error loading posts:', error);
      } finally {
        setLoading(false);
      }
    };

    loadAllPosts();
  }, []);

  useEffect(() => {
    if (!searchTerm.trim()) return;

    let active = true;
    loadBlogSearchIndex()
      .then(index => {
        if (active) setSearchIndex(index);
      })
      .catch(error => console.warn('Full-text blog search is unavailable:', error));

    return () => {
      active = false;
    };
  }, [searchTerm]);

  useEffect(() => {
    setSelectedTag(searchParams.get("tag") || legacySeriesToTag(searchParams.get("series")));
  }, [searchParams]);

  const clearFilters = useCallback(() => {
    setSelectedTag("");
    setSearchTerm("");
    setSearchParams({}, { replace: true });
  }, [setSearchParams]);

  const handleSelectTag = useCallback((tag: string) => {
    setSelectedTag(tag);
    if (tag) {
      setSearchParams({ tag }, { replace: true });
    } else {
      setSearchParams({}, { replace: true });
    }
  }, [setSearchParams]);

  // Memoize all unique tags - only recalculate when posts change
  const allTags = useMemo(() => {
    return Array.from(new Set(posts.flatMap(post => post.tags))).sort();
  }, [posts]);

  const tagGroups = useMemo(() => getOrderedTagGroups(allTags), [allTags]);

  // Memoize filtered posts - only recalculate when dependencies change
  const filteredPosts = useMemo(() => {
    return posts.filter(post => {
      const searchable = [
        post.title,
        post.excerpt,
        post.category,
        post.platform,
        post.series,
        searchIndex[post.id],
        ...(post.tags || []),
        ...(post.tools || [])
      ].filter(Boolean).join(" ").toLowerCase();
      const matchesSearch = searchable.includes(searchTerm.toLowerCase());
      const matchesTag = !selectedTag || post.tags.includes(selectedTag);
      return matchesSearch && matchesTag;
    });
  }, [posts, searchIndex, searchTerm, selectedTag]);

  const tagPlaylists = useMemo(() => {
    const groups = new Map<string, BlogPost[]>();

    filteredPosts.filter(hasSeries).forEach((post) => {
      const groupName = post.series!.trim();
      groups.set(groupName, [...(groups.get(groupName) || []), post]);
    });

    return Array.from(groups.entries())
      .map(([name, groupPosts]) => ({
        name,
        posts: groupPosts.sort((a, b) => {
          const aOrder = typeof a.seriesOrder === "number" ? a.seriesOrder : Number.MAX_SAFE_INTEGER;
          const bOrder = typeof b.seriesOrder === "number" ? b.seriesOrder : Number.MAX_SAFE_INTEGER;

          if (aOrder !== bOrder) return aOrder - bOrder;
          return new Date(b.date).getTime() - new Date(a.date).getTime();
        }),
      }))
      .sort((a, b) => {
        return a.name.localeCompare(b.name);
      });
  }, [filteredPosts]);

  const individualTagPosts = useMemo(() => {
    return filteredPosts.filter(post => !hasSeries(post));
  }, [filteredPosts]);

  const activeFilterCount = [selectedTag, searchTerm]
    .filter(Boolean).length;

  return (
    <>
      <div className="container mx-auto py-12 px-4">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            <span className="text-gradient">DevOps</span> Blog
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Tag-based navigation for cloud implementation logs, CI/CD notes, and hands-on technical tutorials.
          </p>
        </div>

        {/* Search and Filter */}
        <div className="mb-8 space-y-5 rounded-lg border bg-card p-4 md:p-5">
          <div className="relative max-w-2xl mx-auto">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by topic, tool, command, provider, tag, or series..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-center">
              <Badge
                variant={selectedTag === "" ? "default" : "outline"}
                className="cursor-pointer hover:bg-primary/80"
                onClick={() => handleSelectTag("")}
                onKeyDown={(event) => {
                  if (event.key === "Enter" || event.key === " ") {
                    event.preventDefault();
                    handleSelectTag("");
                  }
                }}
                role="button"
                tabIndex={0}
              >
                All Tags
              </Badge>
            </div>

            {tagGroups.map((group) => (
              <div key={group.title} className="space-y-2">
                <p className="text-center text-xs font-semibold uppercase text-muted-foreground">
                  {group.title}
                </p>
                <div className="flex flex-wrap justify-center gap-2">
                  {group.tags.map((tag) => (
                    <Badge
                      key={tag}
                      variant={selectedTag === tag ? "default" : "outline"}
                      className="cursor-pointer hover:bg-primary/80"
                      onClick={() => handleSelectTag(tag)}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleSelectTag(tag);
                        }
                      }}
                      role="button"
                      tabIndex={0}
                    >
                      {tag}
                    </Badge>
                  ))}
                </div>
              </div>
            ))}
          </div>

          {activeFilterCount > 0 && (
            <div className="flex justify-center">
              <Button variant="ghost" size="sm" onClick={clearFilters}>
                <X className="mr-2 h-4 w-4" />
                Clear filters
              </Button>
            </div>
          )}

          <p className="text-center text-sm text-muted-foreground">
            Showing {filteredPosts.length} of {posts.length} articles
          </p>
          </div>

        {loading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
            <BlogCardSkeleton />
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-lg text-muted-foreground">
              No articles found matching your criteria.
            </p>
          </div>
        ) : selectedTag ? (
          <div className="space-y-8">
            <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                  <TagIcon className="h-4 w-4" />
                  Selected Tag
                </div>
                <h2 className="text-2xl font-bold">{selectedTag} Articles</h2>
                <p className="mt-2 max-w-2xl text-muted-foreground">
                  Curated series and individual posts tagged with {selectedTag}.
                </p>
              </div>
              <Badge variant="secondary" className="w-fit">
                {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
              </Badge>
            </div>

            {tagPlaylists.length > 0 && (
              <section data-testid="tag-series-playlists">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">Series Playlists</h3>
                </div>

                <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
                  {tagPlaylists.map((playlist) => (
                    <article key={playlist.name} className="rounded-lg border bg-card p-4">
                      <div className="mb-4 flex items-start justify-between gap-3">
                        <div>
                          <div className="mb-1 flex items-center gap-2 text-sm font-medium text-primary">
                            <ListOrdered className="h-4 w-4" />
                            Playlist
                          </div>
                          <h3 className="text-lg font-semibold">{playlist.name}</h3>
                        </div>
                        <Badge variant="outline" className="shrink-0">
                          {playlist.posts.length} {playlist.posts.length === 1 ? "post" : "posts"}
                        </Badge>
                      </div>

                      <div className="divide-y">
                        {playlist.posts.map((post) => (
                          <Link
                            key={post.id}
                            to={`/blog/${post.id}`}
                            className="group flex items-start justify-between gap-4 py-3 first:pt-0 last:pb-0"
                          >
                            <div className="min-w-0">
                              <p className="font-medium leading-snug group-hover:text-primary">
                                {typeof post.seriesOrder === "number" ? `Day ${post.seriesOrder}: ` : ""}
                                {post.title}
                              </p>
                              <p className="mt-1 line-clamp-2 text-sm text-muted-foreground">
                                {post.excerpt}
                              </p>
                              <div className="mt-2 text-xs text-muted-foreground">
                                {post.readTime}
                              </div>
                            </div>
                            <ArrowRight className="mt-1 h-4 w-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-1 group-hover:text-primary" />
                          </Link>
                        ))}
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            )}

            {individualTagPosts.length > 0 && (
              <section data-testid="individual-tag-articles">
                <div className="mb-4">
                  <h3 className="text-xl font-semibold">Individual Articles</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                  {individualTagPosts.map((post) => (
                    <BlogCard key={post.id} post={post} />
                  ))}
                </div>
              </section>
            )}
          </div>
        ) : (
          <section aria-labelledby="all-articles-heading">
            <h2 id="all-articles-heading" className="sr-only">All Articles</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {filteredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))}
            </div>
          </section>
        )}
      </div>
    </>
  );
};

export default Blog;
