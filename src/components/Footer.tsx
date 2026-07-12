import { Link } from "react-router-dom";
import { Linkedin, Twitter, Github, Mail, ExternalLink, TerminalSquare, Rss } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="border-t bg-card">
      <div className="content-shell py-12">
        <div className="grid grid-cols-1 gap-10 md:grid-cols-[1.4fr_0.7fr_0.7fr_1fr]">
          {/* Brand Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 font-semibold">
              <TerminalSquare className="h-5 w-5 text-primary" />
              Tech With Dikshant
            </div>
            <p className="text-sm text-muted-foreground">
              Tested implementation notes for engineers operating cloud platforms, delivery systems, and production infrastructure.
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Navigate</h3>
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
            <h3 className="mb-4 text-sm font-semibold">Read</h3>
            <div className="space-y-2">
              <Link
                to="/newsletter"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Newsletter
              </Link>
              <Link
                to="/blog"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                Tutorials
              </Link>
              <Link
                to="/about"
                className="block text-sm text-muted-foreground hover:text-primary transition-colors"
              >
                About Me
              </Link>
              <a href="/rss.xml" className="flex items-center gap-2 text-sm text-muted-foreground transition-colors hover:text-primary">
                <Rss className="h-3.5 w-3.5" /> RSS feed
              </a>
            </div>
          </div>

          {/* Connect */}
          <div>
            <h3 className="mb-4 text-sm font-semibold">Elsewhere</h3>
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

        <div className="mt-10 flex flex-col gap-2 border-t pt-6 text-xs text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
          <p>© {new Date().getFullYear()} Tech With Dikshant.</p>
          <p>Built for engineers who verify before they deploy.</p>
        </div>
      </div>
    </footer>
  );
};
