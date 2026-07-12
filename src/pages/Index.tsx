import { Link } from "react-router-dom";
import { BlogCard } from "@/components/BlogCard";
import { BlogCardSkeleton } from "@/components/BlogCardSkeleton";
import { Button } from "@/components/ui/button";
import { loadMarkdownPosts } from "@/utils/markdownLoader";
import { useState, useEffect } from "react";
import { BookOpen, ShieldCheck, Network, Box, Workflow, Zap, Users } from "lucide-react";
import { useSEO } from "@/hooks/useSEO";

const BROWSE_TOPICS = [
  { title: "Security", tag: "Security", description: "Cloud security controls, WAF policy, and production hardening.", icon: ShieldCheck },
  { title: "Networking", tag: "Networking", description: "Routing, load balancing, connectivity, and traffic management.", icon: Network },
  { title: "Containers", tag: "Containers", description: "Docker, Kubernetes, orchestration, and container operations.", icon: Box },
  { title: "CI/CD", tag: "CI/CD", description: "Delivery pipelines, automation, and deployment practices.", icon: Workflow },
] as const;

const Index = () => {
  const [featuredPosts, setFeaturedPosts] = useState([]);
  const [loading, setLoading] = useState(true);

  // SEO optimization for the homepage
  useSEO({
    title: "Tech With Dikshant - DevOps Tutorials & Insights",
    description: "Master DevOps with practical tutorials on Docker, Kubernetes, CI/CD, and cloud technologies. Learn from real-world examples and best practices.",
    keywords: "DevOps, Docker, Kubernetes, CI/CD, GitHub Actions, Cloud, Automation, Tutorials",
    type: "website",
    url: window.location.origin
  });

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const posts = await loadMarkdownPosts();
        const prioritized = [...posts].sort((a, b) => Number(b.featured) - Number(a.featured) || new Date(b.date).getTime() - new Date(a.date).getTime());
        setFeaturedPosts(prioritized.slice(0, 3));
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Master <span className="text-emerald-300">DevOps</span> with Dikshant
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto text-white/90">
            Learn modern DevOps practices, cloud technologies, and automation tools 
            through independent implementation logs, practical tutorials, and real-world examples.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" variant="secondary" asChild>
              <Link to="/blog">
                <BookOpen className="mr-2 h-5 w-5" />
                Explore Blog
              </Link>
            </Button>
            <Button size="lg" variant="secondary" asChild>
              <Link to="/newsletter">Subscribe to Newsletter</Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Topic navigation */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-10">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Browse by <span className="text-gradient">Topic</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-3xl mx-auto">
              Find articles by engineering concern. Providers and products remain searchable as tags.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {BROWSE_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
              <Link
                key={topic.title}
                to={`/blog?tag=${encodeURIComponent(topic.tag)}`}
                className="rounded-lg border bg-card p-5 transition-all hover:border-primary hover:shadow-card"
              >
                <div className="flex items-center gap-2 font-semibold">
                  <Icon className="h-5 w-5 text-primary" />
                  {topic.title}
                </div>
                <p className="mt-3 text-sm text-muted-foreground">
                  {topic.description}
                </p>
              </Link>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-16 px-4 bg-muted/30">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Why Learn DevOps with <span className="text-gradient">Tech With Dikshant</span>
            </h2>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get practical knowledge that you can apply immediately in your projects and career.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <BookOpen className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Practical Tutorials</h3>
              <p className="text-muted-foreground">
                Step-by-step guides with real examples you can follow along and implement in your projects.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Zap className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Latest Technologies</h3>
              <p className="text-muted-foreground">
                Stay updated with the newest tools and best practices in the rapidly evolving DevOps landscape.
              </p>
            </div>
            
            <div className="text-center p-6">
              <div className="w-16 h-16 bg-gradient-primary rounded-full flex items-center justify-center mx-auto mb-4">
                <Users className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold mb-3">Community Focused</h3>
              <p className="text-muted-foreground">
                Join a growing community of DevOps enthusiasts and professionals sharing knowledge and experiences.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Featured Blog Posts */}
      <section className="py-16 px-4">
        <div className="container mx-auto">
          <div className="text-center mb-12">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">
              Latest <span className="text-gradient">Articles</span>
            </h2>
            <p className="text-xl text-muted-foreground">
              Discover the latest insights and tutorials on DevOps and cloud technologies.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-8">
            {loading ? (
              <>
                <BlogCardSkeleton />
                <BlogCardSkeleton />
                <BlogCardSkeleton />
              </>
            ) : (
              featuredPosts.map((post) => (
                <BlogCard key={post.id} post={post} />
              ))
            )}
          </div>
          
          <div className="text-center">
            <Button variant="outline" size="lg" asChild>
              <Link to="/blog">View All Articles</Link>
            </Button>
          </div>
        </div>
      </section>

    </>
  );
};

export default Index;
