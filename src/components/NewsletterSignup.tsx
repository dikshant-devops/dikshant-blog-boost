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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);

    try {
      const response = await fetch("https://app.beehiiv.com/subscribers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "Authorization": "Bvl8Di3vswjanZgCEDzHfaWej4Np8BqOuLWS6GqUNgXJ0vGVXAlAgXyqFFeWdZiCG", // <-- Replace with your Beehiiv API key
        },
        body: JSON.stringify({ email }),
      });

      if (response.ok) {
        toast({
          title: "Successfully subscribed!",
          description: "Thank you for subscribing to our newsletter.",
        });
        setEmail("");
      } else {
        const data = await response.json();
        toast({
          title: "Subscription failed!",
          description: data?.error || "Something went wrong. Please try again.",
        });
      }
    } catch {
      toast({
        title: "Network error!",
        description: "Unable to subscribe. Please try again later.",
      });
    }

    setIsLoading(false);
  };

  if (variant === "inline") {
    return (
      <div className={`bg-muted/50 rounded-lg p-6 ${className}`}>
        <h3 className="text-lg font-semibold mb-2">Subscribe to Our Newsletter</h3>
        <p className="text-muted-foreground mb-4">
          Get the latest DevOps tips and tutorials delivered to your inbox.
        </p>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            type="email"
            placeholder="Enter your email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="flex-1"
            disabled={isLoading}
          />
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
        <form onSubmit={handleSubmit} className="space-y-4">
          <Input
            type="email"
            placeholder="Enter your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={isLoading}
          />
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