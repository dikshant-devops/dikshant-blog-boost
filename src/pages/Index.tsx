import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  ArrowRight,
  BookOpen,
  Box,
  CheckCircle2,
  Network,
  ShieldCheck,
  TerminalSquare,
  Workflow,
} from "lucide-react";

import { BlogCard } from "@/components/BlogCard";
import { BlogCardSkeleton } from "@/components/BlogCardSkeleton";
import { NewsletterSignup } from "@/components/NewsletterSignup";
import { Button } from "@/components/ui/button";
import { useSEO } from "@/hooks/useSEO";
import { type BlogPost } from "@/types/blog";
import { loadMarkdownPosts } from "@/utils/markdownLoader";

const BROWSE_TOPICS = [
  { title: "Security", tag: "Security", description: "Policies, edge controls, identity, and hardening.", icon: ShieldCheck },
  { title: "Networking", tag: "Networking", description: "Routing, load balancing, and traffic behavior.", icon: Network },
  { title: "Containers", tag: "Containers", description: "Docker, Kubernetes, and runtime operations.", icon: Box },
  { title: "CI/CD", tag: "CI/CD", description: "Pipelines, release automation, and deployment safety.", icon: Workflow },
] as const;

const FOCUS_TRACKS = [
  {
    title: "GCP security",
    tag: "GCP",
    description: "Edge protection, traffic controls, and defensive decisions for Google Cloud workloads.",
    icon: ShieldCheck,
    matches: (post: BlogPost) => post.tags.includes("GCP") && post.tags.includes("Security"),
  },
  {
    title: "Delivery automation",
    tag: "CI/CD",
    description: "Build, release, and deployment workflows designed for repeatability and safer changes.",
    icon: Workflow,
    matches: (post: BlogPost) => post.tags.includes("CI/CD"),
  },
  {
    title: "Container operations",
    tag: "Containers",
    description: "Docker and Kubernetes fundamentals connected to real runtime and operations work.",
    icon: Box,
    matches: (post: BlogPost) => post.tags.includes("Containers"),
  },
] as const;

const Index = () => {
  const [posts, setPosts] = useState<BlogPost[]>([]);
  const [loading, setLoading] = useState(true);

  useSEO({
    title: "Tech With Dikshant | Practical DevOps Field Notes",
    description: "Practical DevOps field notes on cloud infrastructure, CI/CD, networking, containers, and reliability, with tested commands and operational context.",
    keywords: "DevOps field notes, cloud infrastructure, CI/CD, networking, containers, site reliability engineering",
    type: "website",
    url: window.location.origin
  });

  useEffect(() => {
    const loadPosts = async () => {
      try {
        const posts = await loadMarkdownPosts();
        const prioritized = posts.filter(post => !post.playlistOnly).sort((a, b) =>
          Number(b.featured) - Number(a.featured) || new Date(b.date).getTime() - new Date(a.date).getTime()
        );
        setPosts(prioritized);
      } finally {
        setLoading(false);
      }
    };
    loadPosts();
  }, []);

  const featuredPosts = useMemo(() => posts.slice(0, 3), [posts]);
  const focusTracks = useMemo(() => FOCUS_TRACKS.map(track => ({
    ...track,
    articles: posts.filter(track.matches),
  })), [posts]);

  return (
    <>
      <section className="relative isolate flex h-[min(580px,calc(100svh-6rem))] min-h-[500px] items-center overflow-hidden bg-black text-white">
        <img
          src="/images/site/devops-operations-hero.jpg"
          srcSet="/images/site/devops-operations-hero-960.jpg 960w, /images/site/devops-operations-hero-1440.jpg 1440w, /images/site/devops-operations-hero.jpg 1920w"
          sizes="100vw"
          alt="Cloud infrastructure operations workspace with deployment and monitoring screens"
          width="1920"
          height="1053"
          loading="eager"
          fetchPriority="high"
          decoding="async"
          className="absolute inset-0 -z-20 h-full w-full object-cover object-[68%_center] md:object-center"
        />
        <div className="absolute inset-0 -z-10 bg-black/60" />
        <div className="content-shell">
          <div className="max-w-2xl">
            <p className="mb-5 flex items-center gap-2 text-xs font-semibold uppercase text-cyan-300" style={{ letterSpacing: "0.12em" }}>
              <TerminalSquare className="h-4 w-4" />
              Production-minded DevOps notes
            </p>
            <h1 className="text-4xl font-bold leading-[1.08] sm:text-5xl md:text-6xl">
              Tech With Dikshant
            </h1>
            <p className="mt-6 max-w-xl text-lg leading-8 text-white/80 md:text-xl">
              Practical cloud, CI/CD, networking, and container guides built around the decisions engineers make in real systems.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Button size="lg" asChild>
                <Link to="/blog">
                  Read the field notes <ArrowRight className="ml-2 h-4 w-4" />
                </Link>
              </Button>
              <Button size="lg" variant="outline" className="border-white/35 bg-black/20 text-white hover:bg-white hover:text-black" asChild>
                <Link to="/about">About the author</Link>
              </Button>
            </div>
          </div>
        </div>
      </section>

      <section className="border-b bg-card" aria-labelledby="topics-heading">
        <div className="content-shell py-8">
          <div className="mb-5 flex items-end justify-between gap-4">
            <div>
              <p className="eyebrow">Browse by problem</p>
              <h2 id="topics-heading" className="mt-1 text-xl font-semibold">Start where your system hurts</h2>
            </div>
            <Link to="/blog" className="hidden items-center gap-1 text-sm font-medium text-primary sm:flex">
              All topics <ArrowRight className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid grid-cols-1 border-t sm:grid-cols-2 lg:grid-cols-4">
            {BROWSE_TOPICS.map((topic) => {
              const Icon = topic.icon;
              return (
                <Link
                  key={topic.title}
                  to={`/blog?tag=${encodeURIComponent(topic.tag)}`}
                  className="group border-b p-4 transition-colors hover:bg-muted/70 sm:odd:border-r lg:border-r lg:last:border-r-0"
                >
                  <Icon className="h-5 w-5 text-primary" />
                  <h3 className="mt-3 font-semibold group-hover:text-primary">{topic.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground">{topic.description}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="content-shell py-16 md:py-20" aria-labelledby="latest-heading">
        <div className="mb-8 flex items-end justify-between gap-4">
          <div>
            <p className="eyebrow">Recently published</p>
            <h2 id="latest-heading" className="mt-2 text-3xl font-bold md:text-4xl">Latest field notes</h2>
          </div>
          <Button variant="outline" asChild className="hidden sm:inline-flex">
            <Link to="/blog">View all articles</Link>
          </Button>
        </div>

        {loading ? (
          <div className="grid gap-6 lg:grid-cols-[1.35fr_0.9fr]">
            <BlogCardSkeleton />
            <div><BlogCardSkeleton /><BlogCardSkeleton /></div>
          </div>
        ) : (
          <div className="grid gap-8 lg:grid-cols-[1.35fr_0.9fr] lg:gap-10">
            {featuredPosts[0] && <BlogCard post={featuredPosts[0]} variant="featured" />}
            <div className="border-t">
              {featuredPosts.slice(1).map(post => <BlogCard key={post.id} post={post} variant="compact" />)}
            </div>
          </div>
        )}
        <Button variant="outline" asChild className="mt-6 w-full sm:hidden">
          <Link to="/blog">View all articles</Link>
        </Button>
      </section>

      <section className="border-y bg-card" aria-labelledby="focus-tracks-heading">
        <div className="content-shell py-14 md:py-16">
          <div className="mb-7 grid gap-3 md:grid-cols-2 md:items-end">
            <div>
              <p className="eyebrow">Explore by focus</p>
              <h2 id="focus-tracks-heading" className="mt-2 text-3xl font-bold md:text-4xl">Build depth in one area</h2>
            </div>
            <p className="max-w-2xl text-muted-foreground md:justify-self-end">
              Follow a subject across related field notes without forcing every article into a playlist.
            </p>
          </div>

          <div
            className="-mx-4 grid snap-x snap-mandatory auto-cols-[82vw] grid-flow-col gap-4 overflow-x-auto overscroll-x-contain px-4 pb-4 sm:auto-cols-[21rem] md:mx-0 md:grid-flow-row md:grid-cols-3 md:overflow-visible md:px-0 md:pb-0"
            aria-label="DevOps focus tracks"
          >
            {focusTracks.map((track, index) => {
              const Icon = track.icon;
              const recentArticles = track.articles.slice(0, 2);
              return (
                <article key={track.title} className="flex min-h-[22rem] snap-start flex-col rounded-md border bg-background p-5 shadow-[var(--shadow-subtle)] md:min-h-[24rem] md:p-6">
                  <div className="flex items-center justify-between gap-4">
                    <span className="flex h-10 w-10 items-center justify-center rounded-md border bg-card text-primary">
                      <Icon className="h-5 w-5" />
                    </span>
                    <span className="font-mono text-xs text-muted-foreground">0{index + 1}</span>
                  </div>

                  <h3 className="mt-5 text-xl font-semibold">{track.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{track.description}</p>
                  <p className="mt-4 text-xs font-semibold uppercase text-foreground" style={{ letterSpacing: "0.08em" }}>
                    {track.articles.length} {track.articles.length === 1 ? "field note" : "field notes"}
                  </p>

                  <div className="mt-5 border-t pt-4">
                    <p className="mb-2 text-xs font-medium text-muted-foreground">Recent in this focus</p>
                    {recentArticles.length > 0 ? (
                      <div className="divide-y">
                        {recentArticles.map(article => (
                          <Link key={article.id} to={`/blog/${article.id}`} className="group/link flex items-start justify-between gap-3 py-3 first:pt-1">
                            <span className="line-clamp-2 text-sm font-medium leading-5 group-hover/link:text-primary">{article.title}</span>
                            <ArrowRight className="mt-0.5 h-4 w-4 shrink-0 text-muted-foreground group-hover/link:text-primary" />
                          </Link>
                        ))}
                      </div>
                    ) : (
                      <p className="py-3 text-sm text-muted-foreground">New field notes are being prepared.</p>
                    )}
                  </div>

                  <Link to={`/blog?tag=${encodeURIComponent(track.tag)}`} className="mt-auto flex items-center justify-between border-t pt-4 text-sm font-semibold text-primary">
                    Explore {track.title}
                    <ArrowRight className="h-4 w-4" />
                  </Link>
                </article>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-b">
        <div className="content-shell grid gap-8 py-14 md:grid-cols-[0.9fr_1.4fr] md:py-16">
          <div>
            <p className="eyebrow">Editorial standard</p>
            <h2 className="mt-2 text-3xl font-bold">Useful after the tab closes</h2>
          </div>
          <div className="grid gap-6 sm:grid-cols-3">
            {[
              ["Operational context", "Why a decision matters before the commands begin."],
              ["Implementation detail", "Concrete configuration, behavior, and failure modes."],
              ["Scan-friendly reference", "Headings, code, and verification steps built for return visits."],
            ].map(([title, description]) => (
              <div key={title} className="border-l pl-4">
                <CheckCircle2 className="h-5 w-5 text-accent" />
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-2 text-sm text-muted-foreground">{description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="content-shell py-16 md:py-20">
        <div className="grid items-center gap-8 border-y py-10 md:grid-cols-[0.85fr_1.15fr]">
          <div>
            <p className="eyebrow">Stay current</p>
            <h2 className="mt-2 text-2xl font-bold md:text-3xl">New notes, without the noise</h2>
            <p className="mt-3 max-w-md text-muted-foreground">
              Receive new implementation guides and operational lessons when they are published.
            </p>
          </div>
          <NewsletterSignup variant="inline" />
        </div>
      </section>
    </>
  );
};

export default Index;
