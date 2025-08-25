import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";

interface NewsletterSignupProps {
  className?: string;
  variant?: "default" | "inline";
}

export const NewsletterSignup = ({ className = "", variant = "default" }: NewsletterSignupProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    // Create form data for Beehiiv
    const form = e.target as HTMLFormElement;
    const formData = new FormData(form);
    
    // Submit to Beehiiv (this will redirect or show success page)
    form.submit();
    
    toast({
      title: "Redirecting to subscription...",
      description: "You'll be redirected to complete your subscription.",
    });
  };

  if (variant === "inline") {
    return (
      <div className={`bg-muted/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-2">Subscribe to Our Newsletter</h3>
        <p className="text-muted-foreground mb-4">
          Get the latest DevOps tips and tutorials delivered to your inbox.
        </p>
        <form 
          action="https://embeds.beehiiv.com/57a1af85-50f4-44eb-bde7-c88cccd2fcd3" 
          method="post" 
          target="_blank"
          onSubmit={handleSubmit} 
          className="flex gap-2"
        >
          <Input
            type="email"
            name="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
          />
          <input type="hidden" name="utm_source" value="website" />
          <input type="hidden" name="utm_medium" value="newsletter_signup" />
          <Button type="submit" disabled={isLoading}>
            {isLoading ? "Subscribing..." : "Subscribe"}
          </Button>
        </form>
      </div>
    );
  }

  return (
    <Card className={`shadow-card ${className}`}>
      <CardHeader className="text-center">
        <CardTitle className="text-2xl">Stay Updated</CardTitle>
        <CardDescription>
          Get the latest DevOps insights and tutorials delivered straight to your inbox.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form 
          action="https://embeds.beehiiv.com/57a1af85-50f4-44eb-bde7-c88cccd2fcd3" 
          method="post" 
          target="_blank"
          onSubmit={handleSubmit} 
          className="space-y-4"
        >
          <Input
            type="email"
            name="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
          />
          <input type="hidden" name="utm_source" value="website" />
          <input type="hidden" name="utm_medium" value="newsletter_signup" />
          <Button 
            type="submit" 
            className="w-full bg-gradient-primary hover:opacity-90" 
            disabled={isLoading}
          >
            {isLoading ? "Subscribing..." : "Subscribe to Newsletter"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};