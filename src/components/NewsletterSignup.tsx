import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/hooks/use-toast';
import { Mail, Loader2 } from 'lucide-react';

const NewsletterSignup = () => {
  const [email, setEmail] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const { toast } = useToast();

  // Beehiiv API configuration
  const BEEHIIV_API_KEY = import.meta.env.VITE_BEEHIIV_API_KEY || 'your-beehiiv-api-key';
  const BEEHIIV_PUBLICATION_ID = import.meta.env.VITE_BEEHIIV_PUBLICATION_ID || 'your-publication-id';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!email) {
      toast({
        title: "Error",
        description: "Please enter your email address.",
        variant: "destructive",
      });
      return;
    }

    if (!email.includes('@')) {
      toast({
        title: "Error",
        description: "Please enter a valid email address.",
        variant: "destructive",
      });
      return;
    }

    setIsLoading(true);

    try {
      // Beehiiv API endpoint for adding subscribers
      const response = await fetch(`https://api.beehiiv.com/v2/publications/${BEEHIIV_PUBLICATION_ID}/subscriptions`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${BEEHIIV_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email,
          reactivate_existing: false,
          send_welcome_email: true,
          utm_source: 'website',
          utm_medium: 'newsletter_signup',
          utm_campaign: 'tech_with_dikshant'
        }),
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Subscription successful:', data);
        
        toast({
          title: "Success!",
          description: "You've been successfully subscribed to our newsletter!",
        });
        setEmail('');
      } else {
        const errorData = await response.json();
        console.error('Beehiiv API Error:', errorData);
        
        // Handle specific Beehiiv errors
        if (response.status === 400 && errorData.errors?.[0]?.detail?.includes('already exists')) {
          toast({
            title: "Already Subscribed",
            description: "This email is already subscribed to our newsletter!",
            variant: "destructive",
          });
        } else {
          throw new Error(errorData.errors?.[0]?.detail || 'Failed to subscribe');
        }
      }
    } catch (error) {
      console.error('Newsletter signup error:', error);
      toast({
        title: "Error",
        description: "Failed to subscribe. Please try again later.",
        variant: "destructive",
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Card className="w-full max-w-md mx-auto">
      <CardHeader className="text-center">
        <CardTitle className="flex items-center justify-center gap-2">
          <Mail className="w-5 h-5" />
          Subscribe to Newsletter
        </CardTitle>
        <CardDescription>
          Get the latest DevOps insights and tutorials delivered to your inbox.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-2">
            <Input
              type="email"
              placeholder="Enter your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={isLoading}
              className="w-full"
            />
          </div>
          <Button 
            type="submit" 
            className="w-full" 
            disabled={isLoading}
          >
            {isLoading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Subscribing...
              </>
            ) : (
              'Subscribe'
            )}
          </Button>
        </form>
        <p className="text-xs text-muted-foreground mt-4 text-center">
          No spam, unsubscribe at any time.
        </p>
      </CardContent>
    </Card>
  );
};

export default NewsletterSignup;
