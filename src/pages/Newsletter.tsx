import { CheckCircle2, Mail, ShieldCheck } from "lucide-react";

import { NewsletterSignup } from "@/components/NewsletterSignup";
import { useSEO } from "@/hooks/useSEO";

const Newsletter = () => {
  useSEO({
    title: "DevOps Newsletter | Tech With Dikshant",
    description: "Subscribe for practical DevOps tutorials, cloud engineering notes, CI/CD guidance, and new technical articles.",
    keywords: "DevOps newsletter, cloud engineering newsletter, CI/CD tutorials",
    type: "website",
    url: `${window.location.origin}/newsletter`
  });

  return (
    <div className="content-shell py-12 md:py-20">
      <div className="mx-auto max-w-5xl">
        <header className="max-w-3xl">
          <p className="eyebrow">Newsletter</p>
          <h1 className="mt-3 text-4xl font-bold leading-tight md:text-6xl">The useful part of the week, in one email</h1>
          <p className="mt-5 text-lg leading-8 text-muted-foreground">
            New DevOps field notes, implementation lessons, and operational context. Sent when there is something worth reading.
          </p>
        </header>

        <div className="mt-12 grid gap-10 border-y py-10 lg:grid-cols-[1fr_0.9fr] lg:gap-16">
          <NewsletterSignup className="self-start" />

          <section aria-labelledby="newsletter-content-heading">
            <div className="flex h-10 w-10 items-center justify-center rounded-md bg-accent/15 text-accent">
              <Mail className="h-5 w-5" />
            </div>
            <h2 id="newsletter-content-heading" className="mt-5 text-2xl font-semibold">What arrives</h2>
            <div className="mt-6 space-y-5">
              {[
                ["New implementation guides", "A concise summary and direct path to the full article."],
                ["Operational lessons", "The tradeoffs, failure modes, and verification steps behind the configuration."],
                ["Tool and platform updates", "Only when they materially change how the work should be done."],
              ].map(([title, description]) => (
                <div key={title} className="flex gap-3">
                  <CheckCircle2 className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
                  <div>
                    <h3 className="font-medium">{title}</h3>
                    <p className="mt-1 text-sm text-muted-foreground">{description}</p>
                  </div>
                </div>
              ))}
            </div>
          </section>
        </div>

        <div className="mt-8 flex items-start gap-3 text-sm text-muted-foreground">
          <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0 text-primary" />
          <p>Your address is used only for this newsletter. Every email includes an unsubscribe option.</p>
        </div>
      </div>
    </div>
  );
};

export default Newsletter;
