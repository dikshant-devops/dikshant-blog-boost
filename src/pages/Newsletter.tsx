import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { CheckCircle, Mail, Users, Calendar } from "lucide-react";
import { useEffect } from "react";

const Newsletter = () => {
  // Dynamically load the Beehiiv script for React compatibility
  useEffect(() => {
    const script = document.createElement("script");
    script.src = "https://subscribe-forms.beehiiv.com/embed.js";
    script.async = true;
    document.body.appendChild(script);
    return () => {
      document.body.removeChild(script);
    };
  }, []);

  return (
    <>
      <div className="container mx-auto py-12 px-4">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-bold mb-4">
              Join Our <span className="text-gradient">Newsletter</span>
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Get the latest DevOps insights, tutorials, and industry updates delivered straight to your inbox.
            </p>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
            {/* Newsletter Signup */}
            <div>
              {/* Beehiiv Embed Start */}
              <iframe
                src="https://subscribe-forms.beehiiv.com/04007123-a5c8-4537-be45-92cfb6ff18ce"
                className="beehiiv-embed"
                data-test-id="beehiiv-embed"
                frameBorder="0"
                scrolling="no"
                style={{
                  width: "660px",
                  height: "307px",
                  margin: 0,
                  borderRadius: "0px",
                  backgroundColor: "transparent",
                  boxShadow: "0 0 #0000",
                  maxWidth: "100%",
                }}
                title="Beehiiv Newsletter Signup"
              ></iframe>
              {/* Beehiiv Embed End */}
            </div>

            {/* Benefits */}
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold">What You'll Get</h2>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-medium">Weekly DevOps Tips</h3>
                    <p className="text-sm text-muted-foreground">
                      Practical tips and best practices for modern DevOps workflows.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-medium">Exclusive Tutorials</h3>
                    <p className="text-sm text-muted-foreground">
                      In-depth tutorials and guides not available on the blog.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-medium">Industry Updates</h3>
                    <p className="text-sm text-muted-foreground">
                      Stay updated with the latest tools and technologies.
                    </p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <CheckCircle className="h-5 w-5 text-accent mt-0.5" />
                  <div>
                    <h3 className="font-medium">Early Access</h3>
                    <p className="text-sm text-muted-foreground">
                      Be the first to know about new content and resources.
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            <Card className="text-center">
              <CardHeader>
                <Mail className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-2xl">Weekly</CardTitle>
                <CardDescription>
                  No spam, just valuable content delivered once a week
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-2xl">500+</CardTitle>
                <CardDescription>
                  DevOps professionals already subscribed
                </CardDescription>
              </CardHeader>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Calendar className="h-8 w-8 text-primary mx-auto mb-2" />
                <CardTitle className="text-2xl">2025</CardTitle>
                <CardDescription>
                  Started helping developers this year
                </CardDescription>
              </CardHeader>
            </Card>
          </div>

          {/* Testimonial */}
          <Card className="bg-muted/50">
            <CardContent className="pt-6">
              <blockquote className="text-lg italic text-center">
                "Tech With Dikshant's newsletter has become an essential part of my weekly reading. 
                The DevOps insights are practical and immediately applicable to my work."
              </blockquote>
              <div className="text-center mt-4">
                <p className="font-medium">— A Happy Subscriber</p>
                <p className="text-sm text-muted-foreground">Senior DevOps Engineer</p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default Newsletter;