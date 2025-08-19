import { Layout } from "@/components/Layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { BookOpen, Code, Zap, Heart, Award, Users } from "lucide-react";
import { Link } from "react-router-dom";

const About = () => {
  const skills = [
    "Docker", "Kubernetes", "AWS", "Azure", "CI/CD", "GitHub Actions", 
    "Terraform", "Ansible", "Jenkins", "Linux", "Python", "Bash"
  ];

  const achievements = [
    { number: "500+", label: "Students Taught" },
    { number: "50+", label: "Tutorials Created" },
    { number: "3+", label: "Years Experience" },
    { number: "95%", label: "Student Success Rate" }
  ];

  return (
    <Layout>
      <div className="container mx-auto py-12 px-4 max-w-4xl">
        {/* Hero Section */}
        <div className="text-center mb-12">
          <div className="w-32 h-32 bg-gradient-primary rounded-full mx-auto mb-6 flex items-center justify-center">
            <span className="text-4xl font-bold text-white">D</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold mb-4">
            Hi, I'm <span className="text-gradient">Dikshant</span>
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            DevOps Engineer, Cloud Architect, and Educator passionate about simplifying 
            complex technologies and helping developers build better systems.
          </p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mb-12">
          {achievements.map((achievement, index) => (
            <Card key={index} className="text-center">
              <CardContent className="pt-6">
                <div className="text-2xl md:text-3xl font-bold text-primary mb-1">
                  {achievement.number}
                </div>
                <div className="text-sm text-muted-foreground">
                  {achievement.label}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>

        {/* About Content */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-12">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Heart className="h-5 w-5 text-primary" />
                My Mission
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                I believe that DevOps and cloud technologies shouldn't be intimidating. 
                My goal is to break down complex concepts into digestible, practical lessons 
                that anyone can follow and implement.
              </p>
              <p className="text-muted-foreground">
                Whether you're a beginner starting your DevOps journey or an experienced 
                developer looking to level up your skills, I'm here to help you succeed.
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Award className="h-5 w-5 text-primary" />
                My Background
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <p className="text-muted-foreground">
                With over 3 years of hands-on experience in DevOps and cloud technologies, 
                I've worked with startups and enterprises to build scalable, reliable systems.
              </p>
              <p className="text-muted-foreground">
                I hold certifications in AWS and Azure, and I'm passionate about staying 
                current with the latest tools and best practices in the rapidly evolving 
                DevOps landscape.
              </p>
            </CardContent>
          </Card>
        </div>

        {/* Skills */}
        <Card className="mb-12">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Code className="h-5 w-5 text-primary" />
              Technologies & Tools
            </CardTitle>
            <CardDescription>
              Technologies I work with and teach about
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {skills.map((skill) => (
                <Badge key={skill} variant="secondary" className="text-sm">
                  {skill}
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* What I Offer */}
        <div className="mb-12">
          <h2 className="text-3xl font-bold text-center mb-8">
            What I <span className="text-gradient">Offer</span>
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="text-center">
              <CardHeader>
                <BookOpen className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Practical Tutorials</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Step-by-step guides with real-world examples you can implement immediately.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Zap className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Best Practices</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Learn industry-standard practices and avoid common pitfalls.
                </p>
              </CardContent>
            </Card>

            <Card className="text-center">
              <CardHeader>
                <Users className="h-12 w-12 text-primary mx-auto mb-4" />
                <CardTitle>Community Support</CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-muted-foreground">
                  Join a community of learners and get help when you need it.
                </p>
              </CardContent>
            </Card>
          </div>
        </div>

        {/* CTA */}
        <Card className="bg-gradient-hero text-white text-center">
          <CardContent className="pt-8 pb-8">
            <h3 className="text-2xl font-bold mb-4">Ready to Level Up Your DevOps Skills?</h3>
            <p className="mb-6 opacity-90">
              Join thousands of developers who are already learning with Tech With Dikshant.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Button size="lg" variant="secondary" asChild>
                <Link to="/blog">
                  <BookOpen className="mr-2 h-5 w-5" />
                  Explore Tutorials
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-primary" asChild>
                <Link to="/connect">Connect with Me</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </Layout>
  );
};

export default About;