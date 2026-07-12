import { Link } from "react-router-dom";
import { memo, useMemo } from "react";
import { Badge } from "@/components/ui/badge";
import { ArrowUpRight, Calendar, Clock, ListVideo } from "lucide-react";
import { BlogPost } from "@/types/blog";

interface BlogCardProps {
  post: BlogPost;
  variant?: "default" | "featured" | "compact";
}

// Memoized component - prevents re-renders when parent updates
export const BlogCard = memo(({ post, variant = "default" }: BlogCardProps) => {
  // Memoize expensive date formatting - only recalculate when post.date changes
  const formattedDate = useMemo(() => {
    return new Date(post.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric"
    });
  }, [post.date]);

  const displayTags = useMemo(() => {
    const classification = new Set([post.category, post.platform].filter(Boolean));
    return post.tags.filter(tag => !classification.has(tag));
  }, [post.category, post.platform, post.tags]);

  const isFeatured = variant === "featured";
  const isCompact = variant === "compact";

  return (
    <article className={`group h-full border-border ${isCompact ? "border-b py-5 last:border-b-0" : "rounded-md border bg-card"}`}>
      <Link
        to={`/blog/${post.id}`}
        className={`flex h-full ${isCompact ? "gap-4" : "flex-col p-5 md:p-6"}`}
        aria-label={post.title}
      >
        <div className={`flex flex-1 flex-col ${isFeatured ? "justify-between" : ""}`}>
          <div>
          <div className="flex flex-wrap gap-2">
            {post.category && (
              <Badge variant="outline" className="text-xs">
                {post.category}
              </Badge>
            )}
            {post.platform && (
              <Badge variant="outline" className="text-xs">
                {post.platform}
              </Badge>
            )}
            {displayTags.slice(0, isFeatured ? 3 : 2).map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <h3 className={`${isFeatured ? "mt-5 text-2xl md:text-3xl" : isCompact ? "mt-3 text-base md:text-lg" : "mt-4 text-xl"} font-semibold leading-tight transition-colors group-hover:text-primary ${isCompact ? "line-clamp-2" : "line-clamp-3"}`}>
            {post.title}
          </h3>
          {!isCompact && (
            <p className={`mt-3 text-muted-foreground ${isFeatured ? "max-w-2xl text-base md:text-lg" : "line-clamp-3 text-sm"}`}>
              {post.excerpt}
            </p>
          )}
          </div>
          <div className="mt-5">
          {(post.playlist || post.series) && (
            <div className="mb-4 flex items-center gap-2 text-sm text-primary">
              <ListVideo className="h-4 w-4" />
              <span className="line-clamp-1">
                {post.playlist || post.series}{typeof (post.playlistOrder ?? post.seriesOrder) === "number" ? ` · Item ${post.playlistOrder ?? post.seriesOrder}` : ""}
              </span>
            </div>
          )}
          <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </div>
            <span className="ml-auto flex items-center gap-1 font-medium text-foreground transition-colors group-hover:text-primary">
              Read <ArrowUpRight className="h-3.5 w-3.5" />
            </span>
          </div>
          </div>
        </div>
      </Link>
    </article>
  );
});

BlogCard.displayName = 'BlogCard';
