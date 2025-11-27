import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Linkedin, Twitter, Github, Mail, MessageCircle, Calendar, ExternalLink } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";

// Extend window interface for Turnstile
declare global {
  interface Window {
    turnstile?: {
      reset: () => void;
      render: (element: string | HTMLElement, options: any) => void;
    };
    onTurnstileSuccess?: (token: string) => void;
  }
}

export default function Connect() {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    subject: "",
    message: ""
  });
  const [isLoading, setIsLoading] = useState(false);
  const [turnstileToken, setTurnstileToken] = useState("");
  const [widgetId, setWidgetId] = useState<string | null>(null);
  const { toast } = useToast();

  // Setup Turnstile with explicit rendering
  useEffect(() => {
    const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY;
    console.log('[Turnstile] Setting up callback');
    console.log('[Turnstile] Site key:', siteKey);

    if (!siteKey) {
      console.error('[Turnstile] No site key found!');
      return;
    }

    // Function to render the widget
    const renderWidget = () => {
      const container = document.getElementById('turnstile-widget');
      if (!container) {
        console.error('[Turnstile] Container element not found');
        return;
      }

      if (!window.turnstile) {
        console.log('[Turnstile] API not ready yet, will retry...');
        return;
      }

      console.log('[Turnstile] Rendering widget...');

      try {
        const id = window.turnstile.render('#turnstile-widget', {
          sitekey: siteKey,
          callback: (token: string) => {
            console.log('[Turnstile] Token received:', token.substring(0, 20) + '...');
            setTurnstileToken(token);
          },
          'error-callback': (error: any) => {
            console.error('[Turnstile] Error:', error);
          },
          theme: 'auto',
        });

        console.log('[Turnstile] Widget rendered with ID:', id);
        setWidgetId(id);
      } catch (error) {
        console.error('[Turnstile] Failed to render widget:', error);
      }
    };

    // Try to render immediately
    if (window.turnstile) {
      renderWidget();
    } else {
      // Wait for Turnstile API to load
      console.log('[Turnstile] Waiting for API to load...');
      const checkInterval = setInterval(() => {
        if (window.turnstile) {
          console.log('[Turnstile] API loaded');
          clearInterval(checkInterval);
          renderWidget();
        }
      }, 100);

      // Timeout after 10 seconds
      setTimeout(() => {
        clearInterval(checkInterval);
        if (!window.turnstile) {
          console.error('[Turnstile] API failed to load after 10 seconds');
        }
      }, 10000);

      return () => clearInterval(checkInterval);
    }
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate form fields
    if (!formData.name || !formData.email || !formData.subject || !formData.message) {
      toast({
        title: "Missing fields",
        description: "Please fill in all fields.",
        variant: "destructive"
      });
      return;
    }

    // Validate Turnstile token
    if (!turnstileToken) {
      toast({
        title: "Verification required",
        description: "Please complete the security check.",
        variant: "destructive"
      });
      return;
    }

    setIsLoading(true);

    try {
      // Send form data to API
      const response = await fetch('/api/contact', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...formData,
          turnstileToken
        })
      });

      // Check if response is ok first
      if (!response.ok) {
        // Try to get error message from response
        let errorMessage = 'Failed to send message';
        try {
          const errorData = await response.json();
          errorMessage = errorData.error || errorMessage;
        } catch {
          errorMessage = `Server error: ${response.status} ${response.statusText}`;
        }
        throw new Error(errorMessage);
      }

      // Parse successful response
      let result;
      try {
        result = await response.json();
      } catch (parseError) {
        throw new Error('Invalid response from server. Please try again.');
      }

      if (result.success) {
        toast({
          title: "Message sent successfully!",
          description: "I'll get back to you as soon as possible.",
        });

        // Reset form
        setFormData({ name: "", email: "", subject: "", message: "" });
        setTurnstileToken("");

        // Reset Turnstile widget
        if (window.turnstile && widgetId) {
          console.log('[Turnstile] Resetting widget');
          window.turnstile.reset(widgetId);
        }
      }
    } catch (error) {
      console.error('Contact form error:', error);
      toast({
        title: "Failed to send message",
        description: error instanceof Error ? error.message : "Please try again later.",
        variant: "destructive"
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value
    }));
  };

  const socialLinks = [
    {
      name: "LinkedIn",
      icon: Linkedin,
      url: "https://linkedin.com/in/dikshant-rai",
      description: "Connect with me professionally and see my career journey",
      color: "text-blue-600"
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://twitter.com/dikshant_rai1",
      description: "Follow for quick DevOps tips and industry insights",
      color: "text-blue-400"
    },
    {
      name: "GitHub",
      icon: Github,
      url: "https://github.com/dikshant-devops",
      description: "Explore my open-source projects and contributions",
      color: "text-gray-700 dark:text-gray-300"
    },
    {
      name: "Email",
      icon: Mail,
      url: "mailto:dikshantdevops@gmail.com",
      description: "Send me a direct email for detailed discussions",
      color: "text-red-600"
    }
  ];

  return (
    <>
      <div className="container mx-auto py-12 px-4 max-w-6xl">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Let's <span className="text-gradient">Connect</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Have questions about DevOps? Want to collaborate? Or just want to say hi? 
            I'd love to hear from you!
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
          {/* Contact Form */}
          <div>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Send Me a Message
                </CardTitle>
                <CardDescription>
                  Fill out the form below and I'll get back to you within 24 hours.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="name">Name</Label>
                      <Input
                        id="name"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        placeholder="Your name"
                        required
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="email">Email</Label>
                      <Input
                        id="email"
                        name="email"
                        type="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        placeholder="your.email@example.com"
                        required
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="subject">Subject</Label>
                    <Input
                      id="subject"
                      name="subject"
                      value={formData.subject}
                      onChange={handleInputChange}
                      placeholder="What's this about?"
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="message">Message</Label>
                    <Textarea
                      id="message"
                      name="message"
                      value={formData.message}
                      onChange={handleInputChange}
                      placeholder="Tell me more about your question or project..."
                      rows={6}
                      required
                    />
                  </div>

                  {/* Debug: Show if environment variable is loaded */}
                  {!import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                    <div className="text-sm text-red-500 text-center">
                      ⚠️ Turnstile site key not configured. Check your .env file.
                    </div>
                  )}

                  {/* Cloudflare Turnstile Widget */}
                  <div className="flex justify-center">
                    <div id="turnstile-widget"></div>
                  </div>

                  {/* Debug: Show if token is received */}
                  {import.meta.env.DEV && turnstileToken && (
                    <div className="text-xs text-green-500 text-center">
                      ✓ Security check passed
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full bg-gradient-primary hover:opacity-90"
                    disabled={isLoading}
                  >
                    {isLoading ? "Sending..." : "Send Message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Social Links & Info */}
          <div className="space-y-6">
            {/* Social Media */}
            <Card>
              <CardHeader>
                <CardTitle>Follow Me Online</CardTitle>
                <CardDescription>
                  Connect with me on social media for regular updates and quick tips.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target={social.name !== "Email" ? "_blank" : undefined}
                    rel={social.name !== "Email" ? "noopener noreferrer" : undefined}
                    className="flex items-start gap-4 p-4 rounded-lg border hover:shadow-card transition-all group"
                  >
                    <social.icon className={`h-6 w-6 ${social.color} group-hover:scale-110 transition-transform`} />
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <h3 className="font-medium group-hover:text-primary transition-colors">
                          {social.name}
                        </h3>
                        {social.name !== "Email" && (
                          <ExternalLink className="h-3 w-3 text-muted-foreground" />
                        )}
                      </div>
                      <p className="text-sm text-muted-foreground">
                        {social.description}
                      </p>
                    </div>
                  </a>
                ))}
              </CardContent>
            </Card>

            {/* Response Time */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="h-5 w-5 text-primary" />
                  Response Time
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Email</span>
                  <span className="text-sm font-medium">Within 24 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">LinkedIn</span>
                  <span className="text-sm font-medium">Within 48 hours</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Twitter</span>
                  <span className="text-sm font-medium">Within 12 hours</span>
                </div>
              </CardContent>
            </Card>

            {/* What to Expect */}
            <Card>
              <CardHeader>
                <CardTitle>What to Expect</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <p className="text-sm">
                      <strong>Quick Response:</strong> I aim to respond to all messages within 24 hours.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <p className="text-sm">
                      <strong>Helpful Answers:</strong> I'll do my best to provide detailed, actionable advice.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <p className="text-sm">
                      <strong>Follow-up:</strong> If needed, I'm happy to continue the conversation.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </>
  );
}