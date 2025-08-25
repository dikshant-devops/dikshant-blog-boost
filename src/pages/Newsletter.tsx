import React from 'react';
import NewsletterSignup from '@/components/NewsletterSignup';
import { Card, CardContent } from '@/components/ui/card';

const Newsletter = () => {
  return (
    <div className="min-h-screen bg-background py-12">
      <div className="container mx-auto px-4 max-w-4xl">
        <div className="text-center mb-12">
          <h1 className="text-4xl font-bold mb-4">Tech With Dikshant Newsletter</h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Join thousands of DevOps professionals who get weekly insights, tutorials, 
            and industry news delivered straight to their inbox.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8 items-start">
          <div className="space-y-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">What You'll Get</h3>
                <ul className="space-y-2 text-muted-foreground">
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Weekly DevOps tutorials and best practices
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Latest industry news and tool reviews
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Exclusive tips and tricks from real-world projects
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Career advice and certification guides
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-primary">•</span>
                    Early access to new content and resources
                  </li>
                </ul>
              </CardContent>
            </Card>

            <Card>
              <CardContent className="p-6">
                <h3 className="text-xl font-semibold mb-3">Why Subscribe?</h3>
                <p className="text-muted-foreground mb-3">
                  Stay ahead in the fast-evolving DevOps landscape with curated content 
                  that saves you time and accelerates your learning.
                </p>
                <p className="text-muted-foreground">
                  Join a community of like-minded professionals who are passionate 
                  about building better, more reliable systems.
                </p>
              </CardContent>
            </Card>
          </div>

          <div className="flex flex-col items-center">
            <NewsletterSignup />
            
            <div className="mt-8 text-center">
              <p className="text-sm text-muted-foreground mb-2">
                Join <strong>5,000+</strong> DevOps professionals
              </p>
              <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
                <span>📧 Weekly delivery</span>
                <span>🚫 No spam</span>
                <span>✅ Easy unsubscribe</span>
              </div>
            </div>
          </div>
        </div>

        <div className="mt-16 text-center">
          <h2 className="text-2xl font-semibold mb-6">Recent Newsletter Issues</h2>
          <div className="grid md:grid-cols-3 gap-6">
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Issue #42: Kubernetes Scaling Strategies</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Deep dive into horizontal and vertical pod autoscaling with practical examples.
                </p>
                <p className="text-xs text-muted-foreground">Published: Dec 15, 2024</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Issue #41: GitOps Best Practices</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  How to implement GitOps workflows with ArgoCD and Flux for better deployment management.
                </p>
                <p className="text-xs text-muted-foreground">Published: Dec 8, 2024</p>
              </CardContent>
            </Card>
            
            <Card>
              <CardContent className="p-6">
                <h3 className="font-semibold mb-2">Issue #40: Infrastructure as Code</h3>
                <p className="text-sm text-muted-foreground mb-3">
                  Terraform vs. Pulumi: A comprehensive comparison for cloud infrastructure management.
                </p>
                <p className="text-xs text-muted-foreground">Published: Dec 1, 2024</p>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
