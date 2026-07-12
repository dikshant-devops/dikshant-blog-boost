import { useEffect, useMemo, useState } from "react";
import { Navigate, Link, useParams } from "react-router-dom";
import { ArrowLeft, Calendar, Clock, Layers } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useSEO } from "@/hooks/useSEO";
import { type BlogPost } from "@/types/blog";
import { loadMarkdownPosts } from "@/utils/markdownLoader";

const Series = () => {
  const { seriesSlug = "" } = useParams();
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  const seriesPosts = useMemo(() => posts
    .filter(post => post.seriesSlug === seriesSlug)
    .sort((a, b) => {
      const aOrder = a.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      const bOrder = b.seriesOrder ?? Number.MAX_SAFE_INTEGER;
      return aOrder - bOrder || new Date(a.date).getTime() - new Date(b.date).getTime();
    }), [posts, seriesSlug]);

  const seriesName = seriesPosts[0]?.series ?? "";

  useSEO(seriesName ? {
    title: `${seriesName} Series | Tech With Dikshant`,
    description: `Read ${seriesPosts.length} ordered ${seriesPosts.length === 1 ? "article" : "articles"} in the ${seriesName} technical series.`,
    keywords: seriesPosts.flatMap(post => post.tags).filter((tag, index, tags) => tags.indexOf(tag) === index).join(", "),
    type: "website",
    url: `${window.location.origin}/series/${seriesSlug}`,
    robots: "index, follow",
  } : null);

  useEffect(() => {
    let active = true;
    loadMarkdownPosts()
      .then(allPosts => {
        if (active) setPosts(allPosts);
      })
      .catch(error => console.error("Error loading series:", error))
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto max-w-4xl px-4 py-10">
        <Skeleton className="mb-8 h-9 w-32" />
        <Skeleton className="mb-3 h-10 w-2/3" />
        <Skeleton className="mb-10 h-5 w-1/2" />
        <div className="space-y-4">
          <Skeleton className="h-32 w-full" />
          <Skeleton className="h-32 w-full" />
        </div>
      </div>
    );
  }

  if (!seriesName) return <Navigate to="/blog" replace />;

  return (
    <main className="container mx-auto max-w-4xl px-4 py-10">
      <Button variant="ghost" asChild className="mb-8">
        <Link to="/blog">
          <ArrowLeft className="mr-2 h-4 w-4" />
          Back to Blog
        </Link>
      </Button>

      <header className="mb-10 border-b pb-8">
        <div className="mb-3 flex items-center gap-2 text-sm font-medium text-primary">
          <Layers className="h-4 w-4" />
          Series
        </div>
        <h1 className="text-3xl font-bold md:text-4xl">{seriesName}</h1>
        <p className="mt-3 text-muted-foreground">
          {seriesPosts.length} ordered {seriesPosts.length === 1 ? "article" : "articles"}. Each article remains independently readable and searchable.
        </p>
      </header>

      <ol className="space-y-4">
        {seriesPosts.map((post, index) => (
          <li key={post.id}>
            <Link
              to={`/blog/${post.id}`}
              className="block rounded-md border p-5 transition-colors hover:border-primary"
            >
              <div className="mb-2 flex flex-wrap items-center gap-2">
                <Badge variant="secondary">Part {post.seriesOrder ?? index + 1}</Badge>
                {post.category && <Badge variant="outline">{post.category}</Badge>}
                {post.platform && <Badge variant="outline">{post.platform}</Badge>}
              </div>
              <h2 className="text-xl font-semibold">{post.title}</h2>
              <p className="mt-2 text-sm text-muted-foreground">{post.excerpt}</p>
              <div className="mt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Calendar className="h-3.5 w-3.5" />{post.date}</span>
                <span className="flex items-center gap-1"><Clock className="h-3.5 w-3.5" />{post.readTime}</span>
              </div>
            </Link>
          </li>
        ))}
      </ol>
    </main>
  );
};

export default Series;
