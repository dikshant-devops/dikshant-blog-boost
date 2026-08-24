# Repository Guardrails

These instructions apply to the entire repository.

## Sources of Truth

- Production is a Cloudflare Pages site built with Node.js `>=22.12.0`, React, TypeScript, and Vite.
- Prefer executable behavior, tests, `README.md`, and `RELEASE.md` over historical notes. `CLAUDE.md` and the legacy cross-post documentation contain outdated assumptions and must be verified against the current code before use.
- Keep changes scoped. Inspect `git status --short` before editing and preserve unrelated user changes.
- Never commit API keys, tokens, production endpoints containing credentials, `.env`, or `.dev.vars`.

## Change Workflow

1. Trace the affected flow from source through generation, runtime use, and deployment before editing.
2. Identify generated files before making changes. Modify their source or generator, never the generated output alone.
3. Run the smallest relevant test after each logical change.
4. Run the complete gate required by the change type before declaring the work complete.
5. Review the final diff and working tree for accidental content, metadata, dependency, or asset changes.

Do not weaken a validator, security check, cache rule, or performance budget merely to make a change pass. A threshold change requires a measured reason and equivalent regression coverage.

## Blog Content Pipeline

- `public/blog-posts/*.md` is the only publishable article source. `scripts/lib/content.js` is the production parser and schema authority.
- Article frontmatter must satisfy the parser: title 30-65 characters, excerpt 90-180 characters, valid dates, 1-8 unique tags, supported taxonomy values, and at least 300 non-code body words.
- Keep the page title in frontmatter. Article bodies begin at H2, maintain H2/H3 hierarchy, and contain no H1. `readTime` is generated.
- Slugs, playlist slugs, and playlist positions must remain unique across the full article set.
- `npm run content:index` regenerates content indexes, article details, search data, sitemap, RSS, robots metadata, and the tracked manifest. Never hand-edit those artifacts as a fix.
- Runtime fallbacks in `src/utils/markdownLoader.ts` are resilience only. A production build must succeed with the generated indexes.

## Plan Every Article Before Writing

Define these points before drafting:

- **Reader:** the role, assumed knowledge, and environment. A beginner guide must explain prerequisites that an advanced troubleshooting note can assume.
- **Reader outcome:** one concrete task or question the reader can complete or answer. Split unrelated outcomes into separate articles.
- **Search intent:** the natural query the article answers. Use it to shape the title, excerpt, opening, and headings without repeating keywords mechanically.
- **Scope:** what is covered, what is deliberately excluded, and any cost, permission, outage, or data-loss risk.
- **Test environment:** provider, service, tool and API versions, operating system or shell, and the date the procedure was verified.
- **Evidence:** commands actually run, configuration inspected, expected state, failure signals, and authoritative references. Never invent output, benchmarks, incidents, quotations, or first-hand experience.
- **Discovery:** the narrowest correct category, platform, tags, tools, difficulty, and optional playlist membership. Taxonomy describes the subject; it is not a list of every technology mentioned.
- **Original value:** the decision rule, tradeoff, diagnostic method, production caveat, or observed behavior that makes the article more useful than a documentation rewrite.

Playlist entries must remain useful as independent articles. State any prerequisite lesson and link to it, but do not make the reader infer missing setup from playlist order.

## Markdown Article Shape

Use this as a default shape and remove sections that do not serve the article. State-changing tutorials require verification and rollback or cleanup; conceptual articles require a clear model and practical example.

```markdown
---
title: "<specific outcome in 30-65 characters>"
excerpt: "<problem, approach, and reader benefit in 90-180 characters>"
date: "YYYY-MM-DD"
updatedDate: "YYYY-MM-DD"
author: "Dikshant Rai"
category: "<supported category>"
platform: "<supported platform or empty string>"
difficulty: "<Beginner, Intermediate, or Advanced>"
tags: ["<platform or core topic>", "<specific service>"]
tools: ["<tools used directly>"]
image: "/images/social/<image>.webp"
---

<Open with the reader's problem, why it matters, and the result this article delivers.>

<Set the scope, tested environment, and important constraints in a second short paragraph.>

## Prerequisites

## How it works

## Implementation

### Step with a specific outcome

## Verify the result

## Failure modes

## Rollback or cleanup

## Production considerations

## Key takeaways

## References
```

Add `playlist`, `playlistOrder`, and `playlistOnly` only when the discovery decision requires them. Use H3 headings for meaningful subsections, not as decoration.

## Editorial Standard

- Lead with the problem and useful result. Remove generic scene-setting, exaggerated claims, repeated introductions, and conclusions that only restate headings.
- Give each paragraph one job. Prefer precise nouns, active verbs, short sentences for procedures, and explicit transitions where reasoning changes.
- Define an acronym or specialized term on first use. Keep terminology, capitalization, resource names, and example identifiers consistent.
- Separate verified facts, observed results, recommendations, and opinions. Explain why a recommendation applies and when a different choice is reasonable.
- Make procedures reproducible: state prerequisites before commands, use fenced blocks with language identifiers, use safe placeholders, and explain the expected signal after each important step.
- Mark destructive, billable, privileged, or production-impacting operations before the command. Include rollback, cleanup, or recovery instructions when state changes.
- Use diagrams for relationships and screenshots only when visual UI state is necessary. Every image needs useful alt text and must add information not already conveyed by nearby prose.
- Prefer primary vendor documentation, specifications, and source repositories. Link a source at the claim it supports, then keep a short `## References` list for the material used.
- Add internal links only when they help the next reader decision. Link text must describe the destination; avoid phrases such as "click here."
- Check every command, link, heading anchor, number, version, and technical claim. Run spelling and grammar review, then read the article once for sequence and once for unnecessary text.
- Change `updatedDate` only after a substantive correction or re-verification. Describe version-sensitive behavior so the article remains honest when tooling changes.

## Tags and Playlists

- Tags are independent article filters. A playlist is optional curated membership, never the parent folder for all articles with a platform tag.
- Playlists are supported only for GCP, AWS, and Kubernetes. Membership requires the matching platform tag and a positive, unique `playlistOrder`.
- `playlistOnly: true` requires playlist membership. Such an article remains directly accessible, searchable, indexed in the sitemap, and visible in its playlist, but stays out of normal feeds, tag listings, homepage sections, RSS, and ordinary recommendations.
- Preserve these discovery rules when changing homepage sections, filtering, search, related articles, RSS, or playlist pages. Test both ordinary and `playlistOnly` articles.

## Images

- Put visible article assets in `public/images/blog/<article-slug>/` and use root-relative Markdown paths with meaningful alt text.
- Put social images in `public/images/social/` and reference them with frontmatter `image`. This field supplies SEO/social metadata; it is not an article hero.
- Prefer compressed WebP for article assets. Social images must be JPEG, PNG, or WebP and satisfy the build budget.
- Keep repository-owned assets local. The production build must verify that every local Markdown image exists and remains under `public/`.

## Routes, SEO, and Errors

- A route change must be reconciled across `src/App.tsx`, `scripts/prerender-blog-pages.js`, `scripts/generate-blog-manifest.js`, `scripts/verify-build.js`, and their tests. Update `public/_headers`, `public/_redirects`, or `public/_routes.json` when the route affects caching, redirects, or Functions.
- Preserve prerendered titles, descriptions, canonicals, one H1, structured data, sitemap entries, and RSS behavior. Client-only metadata is insufficient for production SEO.
- Unknown paths must produce a real noindex `404`. Do not add an SPA catch-all rewrite to `index.html`.
- `/admin` is local-development UI only. Production access must continue to return the no-store, noindex `404` from `functions/admin.js`, and production assets must not contain an admin bundle.
- Keep the legacy `/series/:slug` to `/playlists/:slug` permanent redirect unless a deliberate migration replaces it.

## Cloudflare Functions and Forms

- Newsletter and contact flows are production data paths. Preserve their frontend endpoints, payload fields, Turnstile actions (`newsletter_subscribe` and `contact_submit`), and external storage behavior unless the full contract is intentionally migrated.
- For each Function, preserve this order: origin check, body-size limit, input validation, binding/rate-limit checks, Turnstile verification with exact action and hostname, then the external API call.
- Keep server-side validation even when the UI validates the same field. Do not expose upstream errors, secrets, or sensitive request data in responses or logs.
- `public/_routes.json` limits Function invocation to `/admin`, `/api/contact`, and `/newsletter-subscribe`. Review cost, caching, and security before expanding it.
- Update privacy disclosures when collected fields, processors, purpose, or retention changes.
- Do not make real newsletter or contact submissions during automated testing without explicit authorization; they create external records.

## Performance and Assets

- Treat all limits in `scripts/verify-build.js` as production contracts, including per-chunk and total JavaScript, CSS, content-index, search-index, and image budgets.
- Preserve compact listing data, lazy search/article loading, route-level code splitting, responsive images, and lazy Turnstile loading. Avoid adding site-wide dependencies for route-specific behavior.
- For UI changes, verify desktop and mobile layouts, keyboard access, focus visibility, text wrapping, image dimensions, loading/error states, and the existing subscribe/contact behavior.

## Side-Effecting Tools

- `npm run cross-post` can publish to external platforms. Use `npm run cross-post -- --dry-run` for validation.
- Run a live cross-post only after the user explicitly authorizes the target article and every destination. Do not use `--yes` by default.

## Validation Gates

- Content or article assets: run `npm run content:index`, the relevant content tests, and `npm run build`.
- UI, route, discovery, or SEO changes: run targeted tests, `npm run lint`, `npm run typecheck`, `npm test`, and `npm run build`.
- Function, form, header, redirect, or Cloudflare configuration changes: run targeted Function/config tests, `npm test`, `npm run functions:build`, and `npm run build`.
- Release-impacting work: run `npm run release:check`. If dependency-audit network access is unavailable, report that exact missing check rather than claiming the gate passed.
- Before release, smoke-test `/`, `/blog`, one ordinary article, one `playlistOnly` article by direct URL, one playlist, `/privacy`, `/terms`, and an unknown path. Confirm the unknown path is a real `404`.
