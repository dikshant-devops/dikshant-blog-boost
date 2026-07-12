import { Link } from "react-router-dom";

import { useSEO } from "@/hooks/useSEO";

const Privacy = () => {
  useSEO({
    title: "Privacy Policy | Tech With Dikshant",
    description: "How Tech With Dikshant handles newsletter subscriptions, contact messages, security data, and local preferences.",
    type: "website",
    url: `${window.location.origin}/privacy`,
  });

  return (
    <div className="content-shell max-w-4xl py-12 md:py-20">
      <header className="border-b pb-8">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">Privacy policy</h1>
        <p className="mt-4 text-muted-foreground">Last updated July 12, 2026</p>
      </header>

      <div className="prose prose-lg mt-10 max-w-none dark:prose-invert">
        <p>This policy describes the data used by this website and its publishing, newsletter, and contact workflows.</p>

        <h2>Information you provide</h2>
        <p>Newsletter signup sends your email address to Beehiiv, which manages subscription confirmation, delivery, and unsubscribe requests. Contact submissions include the name, email address, subject, and message you enter.</p>

        <h2>Security and operational data</h2>
        <p>Cloudflare hosts the site and provides Turnstile verification and request rate limiting. Contact submissions also record the connecting IP address and browser user-agent string in SheetDB so abusive submissions can be investigated. Newsletter verification sends the Turnstile token and connecting address to Cloudflare before Beehiiv is called.</p>

        <h2>Service providers</h2>
        <ul>
          <li><strong>Cloudflare:</strong> site delivery, request security, rate limiting, and Turnstile verification.</li>
          <li><strong>Beehiiv:</strong> newsletter subscription records, confirmation, delivery, and unsubscribe processing.</li>
          <li><strong>SheetDB:</strong> storage of contact-form submissions for review and response.</li>
        </ul>
        <p>Each provider processes data under its own terms and privacy policy.</p>

        <h2>Preferences and analytics</h2>
        <p>The selected light or dark theme may be stored in your browser. The public site does not currently include an advertising network or a third-party audience analytics integration.</p>

        <h2>Retention and control</h2>
        <p>A newsletter address remains with Beehiiv until you unsubscribe or request deletion. Contact messages are kept only for correspondence and operational follow-up, then removed manually when they are no longer needed. Every newsletter includes an unsubscribe option.</p>
        <p>To request access to or deletion of information submitted through this site, email <a href="mailto:dikshantdevops@gmail.com">dikshantdevops@gmail.com</a>. Include the email address used for the submission so the record can be located.</p>

        <h2>External links and changes</h2>
        <p>Articles link to external documentation and services that have their own privacy practices. Material changes to this policy will be published on this page with a revised date.</p>

        <p>Questions can also be sent through the <Link to="/connect">contact page</Link>, but do not include credentials, tokens, or private customer information.</p>
      </div>
    </div>
  );
};

export default Privacy;
