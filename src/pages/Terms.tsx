import { Link } from "react-router-dom";

import { useSEO } from "@/hooks/useSEO";

const Terms = () => {
  useSEO({
    title: "Terms of Use | Tech With Dikshant",
    description: "Terms for using Tech With Dikshant articles, code examples, external links, and website services.",
    type: "website",
    url: `${window.location.origin}/terms`,
  });

  return (
    <div className="content-shell max-w-4xl py-12 md:py-20">
      <header className="border-b pb-8">
        <p className="eyebrow">Legal</p>
        <h1 className="mt-3 text-4xl font-bold md:text-5xl">Terms of use</h1>
        <p className="mt-4 text-muted-foreground">Last updated July 12, 2026</p>
      </header>

      <div className="prose prose-lg mt-10 max-w-none dark:prose-invert">
        <h2>Technical information</h2>
        <p>The articles and examples are educational material, not a substitute for reviewing the current documentation, security requirements, cost model, and failure modes of your own environment. Commands can change infrastructure or data. Read them before execution and test in a non-production environment.</p>

        <h2>No professional engagement</h2>
        <p>Reading the site, subscribing, or sending a message does not create a consulting, employment, legal, financial, or support relationship. A response to a contact message is not a service-level commitment.</p>

        <h2>Content and attribution</h2>
        <p>Unless another source or license is identified, the original written content belongs to Tech With Dikshant. You may link to articles and quote short passages with attribution. Do not republish complete articles or present them as your own work.</p>

        <h2>External services</h2>
        <p>Links to cloud providers, repositories, and other websites are supplied for reference. Their availability, content, products, and policies are controlled by their respective operators.</p>

        <h2>Availability and changes</h2>
        <p>The site and its content are provided without a guarantee of uninterrupted availability or suitability for a particular system. Articles may be corrected, updated, moved, or removed as platforms change.</p>

        <h2>Acceptable use</h2>
        <p>Do not abuse the newsletter or contact endpoints, attempt to bypass security controls, interfere with site operation, or submit unlawful, harmful, or confidential third-party material.</p>

        <p>Questions about these terms can be sent through the <Link to="/connect">contact page</Link> or to <a href="mailto:dikshantdevops@gmail.com">dikshantdevops@gmail.com</a>.</p>
      </div>
    </div>
  );
};

export default Terms;
