import React from 'react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import NewsletterSignup from '@/components/NewsletterSignup';

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Hero Section */}
      <section className="relative py-20 overflow-hidden">
        <div className="container mx-auto px-4 max-w-6xl">
          <div className="text-center mb-16">
            <h1 className="text-5xl md:text-6xl font-bold mb-6 bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">
              Tech With Dikshant
            </h1>
            <p className="text-xl md:text-2xl text-muted-foreground mb-8 max-w-3xl mx-auto">
              Master DevOps, Cloud, and Modern Development Practices with Expert Insights and Practical Tutorials
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/newsletter">
                <Button size="lg" className="text-lg px-8">
                  Join Newsletter
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Read Blog
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Newsletter Section */}
      <section className="py-16 bg-muted/30">
        <div className="container mx-auto px-4 max-w-4xl">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Stay Updated</h2>
            <p className="text-lg text-muted-foreground">
              Get weekly DevOps insights, tutorials, and industry news delivered to your inbox
            </p>
          </div>
          <div className="flex justify-center">
            <NewsletterSignup />
          </div>
        </div>
      </section>
    </div>
  );
};

export default Index;
