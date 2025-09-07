import { useParams, Navigate, Link } from "react-router-dom";
import { useState, useEffect } from "react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Calendar, Clock, ArrowLeft } from "lucide-react";
import { type BlogPost } from "@/types/blog";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { loadMarkdownPost, loadMarkdownPosts } from "@/utils/markdownLoader";
import { useSEO, useArticleStructuredData } from "@/hooks/useSEO";

const BlogPost = () => {
  const { id } = useParams();
  const [post, setPost] = useState<BlogPost | null>(null);
  const [allPosts, setAllPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  // SEO optimization - call hooks consistently
  useSEO({
    title: post ? `${post.title} | Tech With Dikshant` : 'Loading... | Tech With Dikshant',
    description: post?.excerpt || 'Loading blog post...',
    keywords: post?.tags.join(', ') || '',
    author: 'Dikshant',
    type: 'article',
    url: `${window.location.origin}/blog/${id}`,
    publishedTime: post ? new Date(post.date).toISOString() : undefined,
    tags: post?.tags || []
  });

  // Add structured data for better search engine understanding
  useArticleStructuredData({
    title: post?.title || 'Loading...',
    description: post?.excerpt || 'Loading blog post...',
    author: 'Dikshant',
    datePublished: post ? new Date(post.date).toISOString() : new Date().toISOString(),
    tags: post?.tags || [],
    readTime: post?.readTime || '5 min'
  });
  
  useEffect(() => {
    const fetchPost = async () => {
      try {
        // Load from markdown file
        const markdownPost = await loadMarkdownPost(id || '');
        setPost(markdownPost);
        
        // Load all posts for related posts section
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
  
  if (loading) {
    return (
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <p className="text-lg text-muted-foreground">Loading blog post...</p>
        </div>
      </div>
    );
  }
  
  if (!post) {
    return <Navigate to="/blog" replace />;
  }

  const formattedDate = new Date(post.date).toLocaleDateString("en-US", {
    year: "numeric",
    month: "long",
    day: "numeric"
  });

  return (
    <>
      <article className="container mx-auto py-8 px-4 max-w-4xl">
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
            {post.tags.map((tag) => (
              <Badge key={tag} variant="secondary">
                {tag}
              </Badge>
            ))}
          </div>
          
          <h1 className="text-3xl md:text-4xl lg:text-5xl font-bold mb-4 leading-tight">
            {post.title}
          </h1>
          
          <div className="flex items-center gap-6 text-muted-foreground">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              <span>{formattedDate}</span>
            </div>
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4" />
              <span>{post.readTime}</span>
            </div>
          </div>
        </header>

        {/* Article Content */}
        <div className="prose prose-lg max-w-none dark:prose-invert">
          <ReactMarkdown 
            remarkPlugins={[remarkGfm]}
            components={{
              // Custom styling for code blocks
              pre: ({ children }) => (
                <pre className="bg-muted p-4 rounded-lg overflow-x-auto border">
                  {children}
                </pre>
              ),
              code: ({ children, className }) => {
                const isInlineCode = !className;
                if (isInlineCode) {
                  return (
                    <code className="bg-muted px-1.5 py-0.5 rounded text-sm font-mono">
                      {children}
                    </code>
                  );
                }
                return <code className="font-mono text-sm">{children}</code>;
              },
              h1: ({ children }) => (
                <h1 className="text-3xl font-bold mt-8 mb-4 text-foreground">
                  {children}
                </h1>
              ),
              h2: ({ children }) => (
                <h2 className="text-2xl font-semibold mt-6 mb-3 text-foreground">
                  {children}
                </h2>
              ),
              h3: ({ children }) => (
                <h3 className="text-xl font-semibold mt-4 mb-2 text-foreground">
                  {children}
                </h3>
              ),
              blockquote: ({ children }) => (
                <blockquote className="border-l-4 border-primary pl-4 italic my-4 text-muted-foreground">
                  {children}
                </blockquote>
              ),
              a: ({ children, href }) => (
                <a 
                  href={href} 
                  className="text-primary hover:text-primary/80 underline"
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  {children}
                </a>
              ),
            }}
          >
            {post.content}
          </ReactMarkdown>
        </div>

        {/* Newsletter Signup */}
        <div className="mt-12 pt-8 border-t">
          <div className="text-center mb-6">
            <h3 className="text-2xl font-semibold mb-2">Subscribe to Our Newsletter</h3>
            <p className="text-muted-foreground">
              Get the latest DevOps tips and tutorials delivered to your inbox
            </p>
          </div>
          <div className="flex justify-center">
            <iframe
              src="https://subscribe-forms.beehiiv.com/04007123-a5c8-4537-be45-92cfb6ff18ce"
              className="beehiiv-embed"
              data-test-id="beehiiv-embed"
              frameBorder="0"
              scrolling="no"
              style={{
                width: "660px",
                height: "307px",
                margin: 0,
                borderRadius: "8px",
                backgroundColor: "transparent",
                boxShadow: "0 0 #0000",
                maxWidth: "100%",
              }}
              title="Beehiiv Newsletter Signup"
            />
          </div>
        </div>

        {/* Related Posts */}
        <div className="mt-12 pt-8 border-t">
          <h3 className="text-2xl font-semibold mb-6">More Articles</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {allPosts
              .filter(p => p.id !== post.id)
              .slice(0, 2)
              .map((relatedPost) => (
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
      </article>
    </>
  );
};

export default BlogPost;