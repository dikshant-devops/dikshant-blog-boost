import { Link } from "react-router-dom";
import { Linkedin, Twitter, Github, Mail, ExternalLink } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto py-12 px-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="text-xl font-semibold text-gradient">
              Tech With Dikshant
            </div>
            <p className="text-sm text-muted-foreground">
              Master DevOps with practical tutorials, insights, and real-world examples. 
              Learn Docker, Kubernetes, CI/CD, and cloud technologies.
            </p>
          </div>
          
          {/* Quick Links */}
          <div>
            <h3 className="font-semibold mb-4">Quick Links</h3>
            <div className="space-y-2">
              <Link 
                to="/" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Home
              </Link>
              <Link 
                to="/blog" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Blog
              </Link>
              <Link 
                to="/about" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                About
              </Link>
              <Link 
                to="/connect" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Connect
              </Link>
            </div>
          </div>

          {/* Resources */}
          <div>
            <h3 className="font-semibold mb-4">Resources</h3>
            <div className="space-y-2">
              <Link 
                to="/newsletter" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Newsletter
              </Link>
              <a 
                href="#" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Tutorials
              </a>
              <a 
                href="#" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Best Practices
              </a>
              <a 
                href="#" 
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Tools & Resources
              </a>
            </div>
          </div>

          {/* Connect */}
          <div>
            <h3 className="font-semibold mb-4">Connect with Me</h3>
            <div className="space-y-3">
              <a 
                href="https://linkedin.com/in/dikshant-rai" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Linkedin className="h-4 w-4" />
                LinkedIn
                <ExternalLink className="h-3 w-3" />
              </a>
              <a 
                href="https://twitter.com/dikshant_rai1" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Twitter className="h-4 w-4" />
                Twitter
                <ExternalLink className="h-3 w-3" />
              </a>
              <a 
                href="https://github.com/dikshant-devops" 
                target="_blank" 
                rel="noopener noreferrer"
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Github className="h-4 w-4" />
                GitHub
                <ExternalLink className="h-3 w-3" />
              </a>
              <a 
                href="mailto:dikshantdevops@gmail.com" 
                className="flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                <Mail className="h-4 w-4" />
                Email
              </a>
            </div>
          </div>
        </div>
        
        <div className="mt-8 pt-8 border-t">
          <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
            <p className="text-sm text-muted-foreground">
              © 2025 Tech With Dikshant. All rights reserved.
            </p>
            <div className="flex items-center space-x-4">
              <a 
                href="#" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Privacy Policy
              </a>
              <a 
                href="#" 
                className="text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Terms of Service
              </a>
            </div>
          </div>
        </div>
      </div>
    </footer>
  );
};