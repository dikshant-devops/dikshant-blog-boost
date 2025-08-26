import { Link } from "react-router-dom";
import { BlogCard } from "@/components/BlogCard";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Button } from "@/components/ui/button";
import { blogPosts } from "@/data/blogPosts";
import { BookOpen, Zap, Users } from "lucide-react";

const Index = () => {
  const featuredPosts = blogPosts.slice(0, 3);

  return (
    <>
      {/* Hero Section */}
      <section className="relative bg-gradient-hero text-white py-20 px-4">
        <div className="container mx-auto text-center">
          <h1 className="text-4xl md:text-6xl font-bold mb-6">
            Master <span className="text-accent">DevOps</span> with Dikshant
          </h1>
          <p className="text-xl md:text-2xl mb-8 max-w-3xl mx-auto opacity-90">
            Learn modern DevOps practices, cloud technologies, and automation tools 
            through practical tutorials and real-world examples.
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
            {featuredPosts.map((post) => (
              <BlogCard key={post.id} post={post} />
            ))}
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
