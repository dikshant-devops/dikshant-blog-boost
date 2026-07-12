import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { CheckCircle, Mail } from "lucide-react";

interface NewsletterSignupProps {
  className?: string;
  variant?: "default" | "inline";
}

export const NewsletterSignup = ({ className = "", variant = "default" }: NewsletterSignupProps) => {
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [subscriptionStep, setSubscriptionStep] = useState<'form' | 'success'>('form');
  const { toast } = useToast();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    try {
      const response = await fetch('/newsletter-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }

      const data = await response.json();

      if (response.ok && data.success) {
        setSubscriptionStep('success');
        setShowModal(true);
        toast({
          title: "Welcome to the newsletter",
          description: "Check your email to confirm your subscription.",
        });
        setEmail("");
      } else {
        toast({
          title: "Subscription failed",
          description: data.error || "Please try again later.",
          variant: "destructive",
        });
      }
    } catch (error) {
      toast({
        title: "Network error",
        description: "Please check your connection and try again.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  const closeModal = () => {
    setShowModal(false);
    setSubscriptionStep('form');
    setIsLoading(false);
  };

  if (variant === "inline") {
    return (
      <>
        <div className={className}>
          <form onSubmit={handleSubmit} className="flex flex-col gap-3 sm:flex-row">
            <Input
              type="email"
              placeholder="you@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              aria-label="Email address"
              className="h-11 flex-1 bg-background"
            />
            <Button type="submit" disabled={isLoading} className="h-11 px-6">
              {isLoading ? "Subscribing..." : "Subscribe"}
            </Button>
          </form>
          <p className="mt-3 text-xs text-muted-foreground">No spam. Unsubscribe at any time.</p>
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[500px]">
            {subscriptionStep === 'success' && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                    <CheckCircle className="w-5 h-5" />
                    Successfully Subscribed!
                  </DialogTitle>
                </DialogHeader>
                <div className="text-center space-y-4">
                  <p className="text-muted-foreground">
                    Thank you for subscribing! You'll receive newsletters from newsletter@techwithdikshant.com
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Please check your email to confirm your subscription.
                  </p>
                  <Button onClick={closeModal} className="w-full">
                    Close
                  </Button>
                </div>
              </>
            )}
          </DialogContent>
        </Dialog>
      </>
    );
  }

  return (
    <>
      <div className={`rounded-md border bg-card p-6 md:p-8 ${className}`}>
        <div className="mb-6">
          <div className="mb-3 flex h-10 w-10 items-center justify-center rounded-md bg-primary/10 text-primary">
            <Mail className="h-5 w-5" />
          </div>
          <h2 className="text-2xl font-semibold">Get new field notes</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Practical DevOps and cloud engineering articles, sent when something useful is published.
          </p>
        </div>
          <form onSubmit={handleSubmit} className="space-y-4">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
            <Button
              type="submit"
              className="w-full"
              disabled={isLoading}
            >
              {isLoading ? "Subscribing..." : "Subscribe to Newsletter"}
            </Button>
          </form>
        <p className="mt-3 text-center text-xs text-muted-foreground">No spam. Unsubscribe at any time.</p>
      </div>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          {subscriptionStep === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600 dark:text-green-400">
                  <CheckCircle className="w-5 h-5" />
                  Successfully Subscribed!
                </DialogTitle>
              </DialogHeader>
              <div className="text-center space-y-4">
                <p className="text-muted-foreground">
                  Thank you for subscribing! You'll receive newsletters from newsletter@techwithdikshant.com
                </p>
                <p className="text-sm text-muted-foreground">
                  Please check your email to confirm your subscription.
                </p>
                <Button onClick={closeModal} className="w-full">
                  Close
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};
