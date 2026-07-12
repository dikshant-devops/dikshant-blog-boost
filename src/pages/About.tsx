import { Link } from "react-router-dom";
import { ArrowRight, BookOpen, Code2, GitBranch, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";

const skills = [
  "GCP", "AWS", "Azure", "Kubernetes", "Docker", "Terraform", "GitHub Actions",
  "Jenkins", "Linux", "Python", "Bash", "Postgres", "Observability"
];

const About = () => {
  useSEO({
    title: "About Dikshant Rai | Sr Site Reliability Engineer",
    description: "Learn about Dikshant Rai's work as a Sr Site Reliability Engineer, technical focus, and practical writing approach.",
    keywords: "Dikshant Rai, Sr Site Reliability Engineer, SRE, DevOps, cloud infrastructure",
    type: "profile",
    image: "/images/about/dikshant-rai.jpg",
    url: `${window.location.origin}/about`
  });

  return (
    <div className="content-shell max-w-6xl py-12 md:py-20">
      <header className="grid gap-10 border-b pb-12 md:grid-cols-[minmax(0,1fr)_20rem] md:items-center lg:gap-16">
        <div className="max-w-3xl">
          <p className="eyebrow">Sr Site Reliability Engineer</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">Dikshant Rai</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground md:text-xl">
            I document the implementation details, tradeoffs, and operational context behind reliable modern infrastructure.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Button asChild><Link to="/blog">Read the articles <ArrowRight className="ml-2 h-4 w-4" /></Link></Button>
            <Button variant="outline" asChild><Link to="/connect">Start a conversation</Link></Button>
          </div>
        </div>
        <figure className="mx-auto w-full max-w-xs md:mx-0 md:justify-self-end">
          <div className="aspect-[4/5] overflow-hidden rounded-md border bg-card shadow-card">
            <img
              src="/images/about/dikshant-rai.jpg"
              alt="Dikshant Rai, Sr Site Reliability Engineer"
              width="868"
              height="1085"
              loading="eager"
              fetchPriority="high"
              decoding="async"
              className="h-full w-full object-cover"
            />
          </div>
          <figcaption className="mt-3 flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" aria-hidden="true" />
            Engineering reliable cloud systems and documenting the decisions behind them.
          </figcaption>
        </figure>
      </header>

      <div className="grid gap-12 py-14 lg:grid-cols-[0.8fr_1.2fr]">
        <section>
          <p className="eyebrow">Technical focus</p>
          <h2 className="mt-2 text-2xl font-semibold">Tools are context, not the lesson</h2>
          <p className="mt-4 text-muted-foreground">
            The goal is to explain how systems behave: where traffic flows, how releases fail, what a security control actually protects, and how to verify the result.
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {skills.map(skill => <Badge key={skill} variant="secondary">{skill}</Badge>)}
          </div>
        </section>

        <section aria-labelledby="principles-heading">
          <p className="eyebrow">Writing principles</p>
          <h2 id="principles-heading" className="mt-2 text-2xl font-semibold">What every guide should deliver</h2>
          <div className="mt-6 grid gap-6 sm:grid-cols-3">
            {[
              [ShieldCheck, "Production context", "The risks and constraints that shape the implementation."],
              [Code2, "Concrete detail", "Commands, configuration, expected behavior, and verification."],
              [GitBranch, "Reasoned choices", "Tradeoffs and alternatives instead of one unexplained recipe."],
            ].map(([Icon, title, description]) => {
              const PrincipleIcon = Icon as typeof ShieldCheck;
              return (
                <div key={String(title)} className="border-t pt-5">
                  <PrincipleIcon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold">{String(title)}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{String(description)}</p>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      <section className="flex flex-col gap-6 border-y py-10 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="eyebrow">Start reading</p>
          <h2 className="mt-2 text-2xl font-semibold">Use the library as a working reference</h2>
        </div>
        <Button variant="outline" size="lg" asChild>
          <Link to="/blog"><BookOpen className="mr-2 h-5 w-5" /> Explore field notes</Link>
        </Button>
      </section>
    </div>
  );
};

export default About;
