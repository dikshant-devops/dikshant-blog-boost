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
  const [subscriptionStep, setSubscriptionStep] = useState<'form' | 'iframe' | 'success'>('form');
  const { toast } = useToast();

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    setShowModal(true);
    setSubscriptionStep('iframe');
    
    // Simulate success after iframe interaction
    setTimeout(() => {
      setIsLoading(false);
    }, 1000);
  };

  const handleSubscriptionSuccess = () => {
    setSubscriptionStep('success');
    toast({
      title: "Welcome to our newsletter! 🎉",
      description: "Check your email to confirm your subscription.",
    });
  };

  const closeModal = () => {
    setShowModal(false);
    setSubscriptionStep('form');
    setEmail("");
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
            {subscriptionStep === 'iframe' && (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-2">
                    <Mail className="w-5 h-5" />
                    Complete Your Subscription
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <iframe
                    src={`https://embeds.beehiiv.com/57a1af85-50f4-44eb-bde7-c88cccd2fcd3?email=${encodeURIComponent(email)}`}
                    width="100%"
                    height="400"
                    frameBorder="0"
                    scrolling="no"
                    onLoad={handleSubscriptionSuccess}
                    className="rounded-lg"
                  />
                  <div className="text-center">
                    <Button onClick={closeModal} variant="outline">
                      Close & Return to Site
                    </Button>
                  </div>
                </div>
              </>
            )}
            
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
          {subscriptionStep === 'iframe' && (
            <>
              <DialogHeader>
                <DialogTitle className="flex items-center gap-2">
                  <Mail className="w-5 h-5" />
                  Complete Your Subscription
                </DialogTitle>
              </DialogHeader>
              <div className="space-y-4">
                <iframe
                  src={`https://embeds.beehiiv.com/57a1af85-50f4-44eb-bde7-c88cccd2fcd3?email=${encodeURIComponent(email)}`}
                  width="100%"
                  height="400"
                  frameBorder="0"
                  scrolling="no"
                  onLoad={handleSubscriptionSuccess}
                  className="rounded-lg"
                />
                <div className="text-center">
                  <Button onClick={closeModal} variant="outline">
                    Close & Return to Site
                  </Button>
                </div>
              </div>
            </>
          )}
          
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