import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Linkedin, Twitter, Github, Mail, MessageCircle, ExternalLink, Send } from "lucide-react";
import { useState, useEffect } from "react";
import { useToast } from "@/hooks/use-toast";
import { useSEO } from "@/hooks/useSEO";

// Extend window interface for Turnstile
declare global {
  interface Window {
    turnstile?: {
      reset: (widgetId?: string) => void;
      render: (element: string | HTMLElement, options: {
        sitekey: string;
        callback: (token: string) => void;
        "error-callback"?: () => void;
        theme?: "auto" | "light" | "dark";
      }) => string;
    };
    onTurnstileSuccess?: (token: string) => void;
  }
}

export default function Connect() {
  useSEO({
    title: "Contact Dikshant Rai | Sr Site Reliability Engineer",
    description: "Contact Dikshant Rai about site reliability engineering, cloud infrastructure, technical collaboration, or published tutorials.",
    keywords: "contact Dikshant Rai, Site Reliability Engineering, SRE, DevOps collaboration, cloud infrastructure",
    type: "website",
    url: `${window.location.origin}/connect`
  });

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

    if (!siteKey) return;
    let active = true;

    const renderWidget = () => {
      if (!active) return;
      const container = document.getElementById('turnstile-widget');
      if (!container || !window.turnstile || container.childElementCount > 0) return;

      try {
        const id = window.turnstile.render('#turnstile-widget', {
          sitekey: siteKey,
          callback: (token: string) => {
            setTurnstileToken(token);
          },
          'error-callback': () => {},
          theme: 'auto',
        });
        setWidgetId(id);
      } catch (error) {
        console.error('[Turnstile] Failed to render widget:', error);
      }
    };

    if (window.turnstile) {
      renderWidget();
      return () => {
        active = false;
      };
    }

    let script = document.querySelector<HTMLScriptElement>('script[data-turnstile-script="true"]');
    if (!script) {
      script = document.createElement('script');
      script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit';
      script.async = true;
      script.defer = true;
      script.setAttribute('data-turnstile-script', 'true');
      document.head.appendChild(script);
    }
    script.addEventListener('load', renderWidget);

    return () => {
      active = false;
      script?.removeEventListener('load', renderWidget);
    };
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
      color: "text-blue-600 dark:text-blue-400"
    },
    {
      name: "Twitter",
      icon: Twitter,
      url: "https://twitter.com/dikshant_rai1",
      description: "Follow for quick DevOps tips and industry insights",
      color: "text-blue-400 dark:text-blue-300"
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
      color: "text-red-600 dark:text-red-400"
    }
  ];

  return (
    <>
      <div className="content-shell max-w-6xl py-12 md:py-20">
        {/* Header */}
        <div className="mb-12 max-w-3xl">
          <p className="eyebrow">Contact</p>
          <h1 className="mt-3 text-4xl font-bold md:text-6xl">Start a useful conversation</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            Ask about a published guide, discuss a DevOps problem, or propose a technical collaboration.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-10 lg:grid-cols-[1.15fr_0.85fr] lg:gap-12">
          {/* Contact Form */}
          <div>
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <MessageCircle className="h-5 w-5 text-primary" />
                  Send a message
                </CardTitle>
                <CardDescription>
                  Share enough context to make the first reply useful.
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
                  {import.meta.env.DEV && !import.meta.env.VITE_TURNSTILE_SITE_KEY && (
                    <div className="text-sm text-red-500 text-center">
                      Turnstile site key is not configured. Check your .env file.
                    </div>
                  )}

                  {/* Cloudflare Turnstile Widget */}
                  <div className="flex justify-center">
                    <div id="turnstile-widget"></div>
                  </div>

                  {/* Debug: Show if token is received */}
                  {import.meta.env.DEV && turnstileToken && (
                    <div className="text-xs text-green-500 text-center">
                      Security check passed
                    </div>
                  )}

                  <Button
                    type="submit"
                    className="w-full"
                    disabled={isLoading}
                  >
                    <Send className="mr-2 h-4 w-4" />
                    {isLoading ? "Sending..." : "Send message"}
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          {/* Social Links & Info */}
          <div className="space-y-6">
            {/* Social Media */}
            <Card className="rounded-md shadow-none">
              <CardHeader>
                <CardTitle>Find me elsewhere</CardTitle>
                <CardDescription>
                  Public profiles, code, and direct email.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {socialLinks.map((social) => (
                  <a
                    key={social.name}
                    href={social.url}
                    target={social.name !== "Email" ? "_blank" : undefined}
                    rel={social.name !== "Email" ? "noopener noreferrer" : undefined}
                    className="group flex items-start gap-4 border-b py-4 transition-colors last:border-b-0 hover:text-primary"
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

            {/* What to Expect */}
            <Card className="rounded-md border-l-4 border-l-primary shadow-none">
              <CardHeader>
                <CardTitle>For the best response</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <p className="text-sm">
                      <strong>Include the environment:</strong> Platform, tooling, and relevant versions.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <p className="text-sm">
                      <strong>Describe observed behavior:</strong> What happened, not only what was expected.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="w-2 h-2 bg-primary rounded-full mt-2" />
                  <div>
                    <p className="text-sm">
                      <strong>Remove secrets:</strong> Never send credentials, tokens, or private customer data.
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
