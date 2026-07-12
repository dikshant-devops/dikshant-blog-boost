
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
import { Layers, Search, Tag as TagIcon, X } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const Blog = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedTag, setSelectedTag] = useState(() => searchParams.get("tag") || "");
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
    setSelectedTag(searchParams.get("tag") || "");
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

  const seriesCollections = useMemo(() => {
    const collections = new Map<string, { name: string; slug: string; count: number }>();
    posts.forEach(post => {
      if (!post.series || !post.seriesSlug) return;
      const existing = collections.get(post.seriesSlug);
      collections.set(post.seriesSlug, {
        name: post.series,
        slug: post.seriesSlug,
        count: (existing?.count ?? 0) + 1,
      });
    });
    return Array.from(collections.values()).sort((a, b) => a.name.localeCompare(b.name));
  }, [posts]);

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

        {!loading && !selectedTag && !searchTerm && seriesCollections.length > 0 && (
          <section aria-labelledby="series-heading" className="mb-10 border-y py-6">
            <div className="mb-4 flex items-center gap-2">
              <Layers className="h-5 w-5 text-primary" />
              <h2 id="series-heading" className="text-xl font-semibold">Series</h2>
            </div>
            <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
              {seriesCollections.map(series => (
                <Link
                  key={series.slug}
                  to={`/series/${series.slug}`}
                  className="flex items-center justify-between gap-4 rounded-md border p-4 transition-colors hover:border-primary"
                >
                  <span className="font-medium">{series.name}</span>
                  <span className="text-sm text-muted-foreground">
                    {series.count} {series.count === 1 ? "part" : "parts"}
                  </span>
                </Link>
              ))}
            </div>
          </section>
        )}

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
        ) : (
          <section aria-labelledby="article-collection-heading" className="space-y-6">
            {selectedTag ? (
              <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
                <div>
                  <div className="mb-2 flex items-center gap-2 text-sm font-medium text-primary">
                    <TagIcon className="h-4 w-4" />
                    Selected Tag
                  </div>
                  <h2 id="article-collection-heading" className="text-2xl font-bold">{selectedTag} Articles</h2>
                  <p className="mt-2 max-w-2xl text-muted-foreground">
                    All articles tagged with {selectedTag}, ordered by publication date.
                  </p>
                </div>
                <Badge variant="secondary" className="w-fit">
                  {filteredPosts.length} {filteredPosts.length === 1 ? "article" : "articles"}
                </Badge>
              </div>
            ) : (
              <h2 id="article-collection-heading" className="sr-only">All Articles</h2>
            )}
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
