import { useParams, Navigate, Link } from "react-router-dom";
import { ReactNode, useState, useEffect, useMemo, lazy, Suspense } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Calendar, Clock, ArrowLeft, Check, Copy, Layers } from "lucide-react";
import { type BlogPost } from "@/types/blog";
import { loadMarkdownPost, loadMarkdownPosts } from "@/utils/markdownLoader";
import { useSEO, useArticleStructuredData } from "@/hooks/useSEO";
import remarkGfm from "remark-gfm";
import { NewsletterSignup } from "@/components/NewsletterSignup";

// Code-split markdown rendering - loads only when viewing blog posts
const ReactMarkdown = lazy(() => import("react-markdown"));

const slugifyHeading = (value: string) =>
  value
    .toLowerCase()
    .replace(/&/g, " and ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const articlePageTitle = (title: string) =>
  title.length <= 49 ? `${title} | Tech With Dikshant` : title;

const childrenToText = (children: ReactNode): string => {
  if (typeof children === "string" || typeof children === "number") return String(children);
  if (Array.isArray(children)) return children.map(childrenToText).join("");
  if (children && typeof children === "object" && "props" in children) {
    const props = children.props as { children?: ReactNode };
    return childrenToText(props.children);
  }
  return "";
};

type MarkdownNode = {
  position?: {
    start?: {
      line?: number;
    };
  };
};

export const CodeBlock = ({ children }: { children: ReactNode }) => {
  const [copied, setCopied] = useState(false);
  const code = childrenToText(children).trim();

  const copyCode = async () => {
    if (!code) return;

    let didCopy = false;
    try {
      if (navigator.clipboard?.writeText) {
        await navigator.clipboard.writeText(code);
        didCopy = true;
      }
    } catch {
      didCopy = false;
    }

    if (!didCopy) {
      const textarea = document.createElement('textarea');
      textarea.value = code;
      textarea.setAttribute('readonly', '');
      textarea.style.position = 'fixed';
      textarea.style.opacity = '0';
      document.body.appendChild(textarea);
      textarea.select();
      didCopy = document.execCommand('copy');
      textarea.remove();
    }

    if (!didCopy) return;
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="group relative my-5 overflow-hidden rounded-lg border bg-muted">
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={copyCode}
        className="absolute right-2 top-2 h-8 gap-1 bg-background/80 px-2 opacity-100 backdrop-blur md:opacity-0 md:group-hover:opacity-100"
      >
        {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
        <span className="text-xs">{copied ? "Copied" : "Copy"}</span>
      </Button>
      <pre className="overflow-x-auto p-4 pr-20 text-foreground">
        {children}
      </pre>
    </div>
  );
};

const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // SEO optimization - call hooks consistently
  useSEO(post ? {
    title: articlePageTitle(post.title),
    description: post.excerpt,
    keywords: post.tags.join(', '),
    author: post.author || 'Dikshant Sharma',
    type: 'article',
    url: post.canonicalUrl || `${window.location.origin}/blog/${id}`,
    image: post.image,
    publishedTime: new Date(post.date).toISOString(),
    modifiedTime: post.updatedDate ? new Date(post.updatedDate).toISOString() : undefined,
    tags: post.tags
  } : null);

  // Add structured data for better search engine understanding
  useArticleStructuredData(post ? {
    title: post.title,
    description: post.excerpt,
    author: post.author || 'Dikshant Sharma',
    datePublished: new Date(post.date).toISOString(),
    dateModified: post.updatedDate ? new Date(post.updatedDate).toISOString() : undefined,
    image: post.image,
    tags: post.tags,
    readTime: post.readTime,
    url: post.canonicalUrl || `${window.location.origin}/blog/${id}`
  } : null);
  
  // Memoize related posts by tag relevance
  const relatedPosts = useMemo(() => {
    if (!post || allPosts.length === 0) return [];
    const others = allPosts.filter(p => p.id !== post.id);
    // Score by number of shared tags
    const scored = others.map(p => ({
      post: p,
      shared: p.tags.filter(t => post.tags.includes(t)).length,
    }));
    scored.sort((a, b) => b.shared - a.shared || new Date(b.post.date).getTime() - new Date(a.post.date).getTime());
    return scored.slice(0, 2).map(s => s.post);
  }, [post, allPosts]);

  const displayTags = useMemo(() => {
    if (!post) return [];
    const classification = new Set([post.category, post.platform].filter(Boolean));
    return post.tags.filter(tag => !classification.has(tag));
  }, [post]);

  // Memoize expensive date formatting - MUST be before early returns (Rules of Hooks)
  const formattedDate = useMemo(() => {
    if (!post) return '';
    return new Date(post.date).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric"
    });
  }, [post]);

  // Memoize markdown components configuration - MUST be before early returns
  const markdownComponents = useMemo(() => ({
    // Custom styling for code blocks
    pre: ({ children }: { children?: ReactNode }) => (
      <CodeBlock>{children}</CodeBlock>
    ),
    code: ({ children, className }: { children?: ReactNode; className?: string }) => {
      const isInlineCode = !className;
      if (isInlineCode) {
        return (
          <code className="bg-muted text-foreground px-1.5 py-0.5 rounded text-sm font-mono">
            {children}
          </code>
        );
      }
      return <code className="font-mono text-sm">{children}</code>;
    },
    h1: ({ children }: { children?: ReactNode }) => (
      <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground">
        {children}
      </h1>
    ),
    h2: ({ children, node }: { children?: ReactNode; node?: MarkdownNode }) => (
      <h2 id={post?.headings?.find(heading => heading.line === node?.position?.start?.line)?.id || slugifyHeading(childrenToText(children))} className="scroll-mt-24 text-2xl font-semibold mt-8 mb-3 text-foreground">
        {children}
      </h2>
    ),
    h3: ({ children, node }: { children?: ReactNode; node?: MarkdownNode }) => (
      <h3 id={post?.headings?.find(heading => heading.line === node?.position?.start?.line)?.id || slugifyHeading(childrenToText(children))} className="scroll-mt-24 text-xl font-semibold mt-5 mb-2 text-foreground">
        {children}
      </h3>
    ),
    blockquote: ({ children }: { children?: ReactNode }) => (
      <blockquote className="rounded-r-lg border-l-4 border-primary bg-primary/5 py-3 pl-4 pr-3 my-4 text-muted-foreground">
        {children}
      </blockquote>
    ),
    a: ({ children, href }: { children?: ReactNode; href?: string }) => (
      <a
        href={href}
        className="text-primary hover:text-primary/80 underline"
        target={href?.startsWith("/") || href?.startsWith("#") ? undefined : "_blank"}
        rel={href?.startsWith("/") || href?.startsWith("#") ? undefined : "noopener noreferrer"}
      >
        {children}
      </a>
    ),
    img: ({ src, alt }: { src?: string; alt?: string }) => (
      <img
        src={src}
        alt={alt || ''}
        loading="lazy"
        className="rounded-lg max-w-full h-auto my-6 border"
      />
    ),
    table: ({ children }: { children?: ReactNode }) => (
      <div className="my-6 overflow-x-auto rounded-lg border">
        <table className="w-full border-collapse text-sm">{children}</table>
      </div>
    ),
    th: ({ children }: { children?: ReactNode }) => (
      <th className="border-b bg-muted px-3 py-2 text-left font-semibold">{children}</th>
    ),
    td: ({ children }: { children?: ReactNode }) => (
      <td className="border-b px-3 py-2 align-top">{children}</td>
    ),
  }), [post?.headings]);

  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Optimized: Single call - cache handles efficiency
        // loadMarkdownPost checks cache first, then loads directly
        const markdownPost = await loadMarkdownPost(id || '');
        setPost(markdownPost);

        // Load all posts for related posts - uses cache if available
        const allPosts = await loadMarkdownPosts();
        setAllPosts(allPosts);
      } catch (error) {
        console.error('Error loading post:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchPost();
  }, [id]);

  // Early returns AFTER all hooks
  if (loading) {
    return (
      <div className="container mx-auto py-8 px-4 max-w-4xl">
        <Skeleton className="h-9 w-32 mb-6" />
        <div className="mb-8 space-y-4">
          <div className="flex gap-2">
            <Skeleton className="h-5 w-16" />
            <Skeleton className="h-5 w-20" />
          </div>
          <Skeleton className="h-10 w-3/4" />
          <Skeleton className="h-10 w-1/2" />
          <div className="flex gap-6">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24" />
          </div>
        </div>
        <div className="space-y-3">
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-5/6" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-2/3" />
          <Skeleton className="h-32 w-full rounded-lg" />
          <Skeleton className="h-4 w-full" />
          <Skeleton className="h-4 w-4/5" />
        </div>
      </div>
    );
  }

  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  return (
    <>
      <article className="container mx-auto py-8 px-4 max-w-6xl">
        {/* Back to Blog */}
        <Button variant="ghost" asChild className="mb-6">
          <Link to="/blog" className="flex items-center gap-2">
            <ArrowLeft className="h-4 w-4" />
            Back to Blog
          </Link>
        </Button>

        {/* Article Header */}
        <header className="mb-8">
          <div className="flex flex-wrap gap-2 mb-4">
            {post.category && (
              <Badge variant="outline">
                {post.category}
              </Badge>
            )}
            {post.platform && (
              <Badge variant="outline">
                {post.platform}
              </Badge>
            )}
            {displayTags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex flex-wrap items-center gap-x-6 gap-y-2 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.readTime}</span>
            </div>
            {post.series && (
              <Link
                to={`/series/${post.seriesSlug}`}
                className="flex items-center gap-2 hover:text-primary"
              >
                <Layers className="h-4 w-4" />
                <span>
                  {post.series}{typeof post.seriesOrder === "number" ? ` · Part ${post.seriesOrder}` : ""}
                </span>
              </Link>
            )}
          </div>
        </header>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[minmax(0,1fr)_18rem]">
          <div>
            {/* Article Content - Code-split with Suspense */}
            <div className="prose prose-lg max-w-none dark:prose-invert">
              <Suspense fallback={<div className="text-center py-8 text-muted-foreground">Loading content...</div>}>
                <ReactMarkdown
                  remarkPlugins={[remarkGfm]}
                  components={markdownComponents}
                >
                  {post.content}
                </ReactMarkdown>
              </Suspense>
            </div>

            {/* Newsletter Signup */}
            <div className="mt-12 pt-8 border-t">
              <NewsletterSignup variant="inline" className="max-w-2xl mx-auto" />
            </div>

            {/* Related Posts */}
            <div className="mt-12 pt-8 border-t">
              <h3 className="text-2xl font-semibold mb-6">More Articles</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {relatedPosts.map((relatedPost) => (
                    <Link
                      key={relatedPost.id}
                      to={`/blog/${relatedPost.id}`}
                      className="block p-4 border rounded-lg hover:shadow-card transition-all"
                    >
                      <h4 className="font-semibold mb-2 hover:text-primary transition-colors">
                        {relatedPost.title}
                      </h4>
                      <p className="text-sm text-muted-foreground line-clamp-2">
                        {relatedPost.excerpt}
                      </p>
                    </Link>
                  ))}
              </div>
            </div>
          </div>

          <aside className="order-first lg:order-none">
            <div className="sticky top-24 space-y-6">
              {post.headings && post.headings.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                  <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                    On This Page
                  </h2>
                  <nav className="space-y-2">
                    {post.headings.slice(0, 12).map((heading) => (
                      <a
                        key={heading.id}
                        href={`#${heading.id}`}
                        className={`block text-sm text-muted-foreground hover:text-primary ${
                          heading.level === 3 ? "pl-3" : ""
                        }`}
                      >
                        {heading.text}
                      </a>
                    ))}
                  </nav>
                </div>
              )}

              <div className="rounded-lg border bg-card p-4">
                <h2 className="mb-3 text-sm font-semibold uppercase tracking-wide text-muted-foreground">
                  Article Metadata
                </h2>
                <div className="space-y-3 text-sm">
                  {post.difficulty && (
                    <div>
                      <p className="text-muted-foreground">Difficulty</p>
                      <p className="font-medium">{post.difficulty}</p>
                    </div>
                  )}
                  {post.tools && post.tools.length > 0 && (
                    <div>
                      <p className="text-muted-foreground">Tools</p>
                      <div className="mt-1 flex flex-wrap gap-1">
                        {post.tools.map((tool) => (
                          <Badge key={tool} variant="outline" className="text-xs">
                            {tool}
                          </Badge>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </aside>
        </div>
      </article>
    </>
  );
};

export default BlogPost;
