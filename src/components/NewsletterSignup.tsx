import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
      console.log('Attempting to subscribe email:', email);
      
      const response = await fetch('/newsletter-subscribe', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
        }),
      });

      console.log('Response status:', response.status);
      console.log('Response headers:', Object.fromEntries(response.headers.entries()));
      
      if (!response.ok) {
        console.error('Response not ok:', response.status, response.statusText);
        const errorText = await response.text();
        console.error('Error response body:', errorText);
        throw new Error(`HTTP ${response.status}: ${errorText}`);
      }
      
      const data = await response.json();
      console.log('Response data:', data);

      if (response.ok && data.success) {
        setSubscriptionStep('success');
        setShowModal(true);
        toast({
          title: "Welcome to our newsletter! 🎉",
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
        <div className={`bg-muted/50 rounded-lg p-6 ${className}`}>
          <h3 className="text-lg font-semibold mb-2">Subscribe to Our Newsletter</h3>
          <p className="text-muted-foreground mb-4">
            Get the latest DevOps tips and tutorials delivered to newsletter@techwithdikshant.com
          </p>
          <form onSubmit={handleSubmit} className="flex gap-2">
            <Input
              type="email"
              placeholder="Enter your email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="flex-1"
            />
            <Button type="submit" disabled={isLoading}>
              {isLoading ? "Loading..." : "Subscribe"}
            </Button>
          </form>
        </div>

        <Dialog open={showModal} onOpenChange={setShowModal}>
          <DialogContent className="sm:max-w-[500px]">
            {subscriptionStep === 'success' && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2 text-green-600">
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
                    Return to Home Page
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
      <Card className={`shadow-card ${className}`}>
        <CardHeader className="text-center">
          <CardTitle className="text-2xl">Stay Updated</CardTitle>
          <CardDescription>
            Get the latest DevOps insights and tutorials delivered from newsletter@techwithdikshant.com
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
            />
            <Button 
              type="submit" 
              className="w-full bg-gradient-primary hover:opacity-90" 
              disabled={isLoading}
            >
              {isLoading ? "Loading..." : "Subscribe to Newsletter"}
            </Button>
          </form>
        </CardContent>
      </Card>

      <Dialog open={showModal} onOpenChange={setShowModal}>
        <DialogContent className="sm:max-w-[500px]">
          {subscriptionStep === 'success' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2 text-green-600">
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
                  Return to Home Page
                </Button>
              </div>
            </>
          )}
        </DialogContent>
      </Dialog>
    </>
  );
};