import { Link } from "react-router-dom";
import { memo, useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Calendar, Clock, Layers } from "lucide-react";
import { BlogPost } from "@/types/blog";

interface BlogCardProps {
  post: BlogPost;
}

// Memoized component - prevents re-renders when parent updates
export const BlogCard = memo(({ post }: BlogCardProps) => {
  // Memoize expensive date formatting - only recalculate when post.date changes
  const formattedDate = useMemo(() => {
    return new Date(post.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }, [post.date]);

  const displayTags = useMemo(() => {
    const classification = new Set([post.category, post.platform].filter(Boolean));
    return post.tags.filter(tag => !classification.has(tag));
  }, [post.category, post.platform, post.tags]);

  return (
    <Link to={`/blog/${post.id}`} className="block h-full group" aria-label={post.title}>
      <Card className="h-full hover:shadow-card transition-all duration-300 group-hover:-translate-y-1">
        <CardHeader className="space-y-4">
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
            {displayTags.map((tag) => (
              <Badge key={tag} variant="secondary" className="text-xs">
                {tag}
              </Badge>
            ))}
          </div>
          <h3 className="text-xl font-semibold group-hover:text-primary transition-colors line-clamp-2">
            {post.title}
          </h3>
        </CardHeader>
        <CardContent className="space-y-4">
          {post.series && (
            <div className="flex items-center gap-2 text-sm text-primary">
              <Layers className="h-4 w-4" />
              <span className="line-clamp-1">
                {post.series}{typeof post.seriesOrder === "number" ? ` · Part ${post.seriesOrder}` : ""}
              </span>
            </div>
          )}
          <p className="text-muted-foreground line-clamp-3">
            {post.excerpt}
          </p>
          <div className="flex items-center gap-4 text-sm text-muted-foreground">
            <div className="flex items-center gap-1">
              <Calendar className="h-4 w-4" />
              {formattedDate}
            </div>
            <div className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              {post.readTime}
            </div>
          </div>
        </CardContent>
      </Card>
    </Link>
  );
});

BlogCard.displayName = 'BlogCard';
