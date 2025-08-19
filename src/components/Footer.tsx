import { Link } from "react-router-dom";

export const Footer = () => {
  return (
    <footer className="border-t bg-muted/50">
      <div className="container mx-auto py-8 px-4">
        <div className="flex flex-col md:flex-row items-center justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-2">
            <div className="text-lg font-semibold text-gradient">
              Tech With Dikshant
            </div>
          </div>
          
          <div className="flex items-center space-x-6">
            <Link 
              to="/" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Home
            </Link>
            <Link 
              to="/blog" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Blog
            </Link>
            <Link 
              to="/newsletter" 
              className="text-sm text-muted-foreground hover:text-primary transition-colors"
            >
              Newsletter
            </Link>
          </div>
        </div>
        
        <div className="mt-6 pt-6 border-t text-center">
          <p className="text-sm text-muted-foreground">
            © 2025 Tech With Dikshant. All rights reserved.
          </p>
        </div>
      </div>
    </footer>
  );
};