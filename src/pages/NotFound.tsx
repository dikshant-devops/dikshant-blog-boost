import { Link } from "react-router-dom";
import { useSEO } from "@/hooks/useSEO";

const NotFound = () => {
  useSEO({
    title: "Page Not Found | Tech With Dikshant",
    description: "The requested page could not be found.",
    type: "website",
    url: window.location.href,
    robots: "noindex, nofollow"
  });

  return (
    <div className="flex items-center justify-center min-h-[60vh]">
      <div className="text-center">
        <h1 className="text-4xl font-bold mb-4">404</h1>
        <p className="text-xl text-muted-foreground mb-4">Oops! Page not found</p>
        <Link to="/" className="text-primary hover:text-primary/80 underline">
          Return to Home
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
