# Production Release Runbook

## Preconditions

1. Confirm `git status --short` contains only the intended release changes.
2. Confirm `.dev.vars` is ignored and no production secret is present in a tracked file.
3. In Cloudflare Pages, configure the public build variable `VITE_TURNSTILE_SITE_KEY` plus the server variables or secrets `BEEHIIV_API_KEY`, `BEEHIIV_PUBLICATION_ID`, `SHEETDB_API_URL`, `TURNSTILE_SECRET_KEY`, and `TURNSTILE_ALLOWED_HOSTNAMES`.
4. Confirm the Turnstile widget allows `techwithdikshant.com` and its server response uses the expected `newsletter_subscribe` and `contact_submit` actions.

For local form testing, copy `.env.example` to an ignored `.env` file and the variable names from `.dev.vars.example` into an ignored `.dev.vars` file. Use Cloudflare's documented Turnstile test credentials. Keep local hostnames out of the production `TURNSTILE_ALLOWED_HOSTNAMES` value.

## Release Gate

Run:

```bash
npm run release:check
```

This checks whitespace, lint, TypeScript, the full unit suite, production generation and prerendering, bundle budgets, Cloudflare Function compilation, rate-limit binding configuration, and dependency advisories.

Record the release commit before deployment:

```bash
git rev-parse HEAD
```

After deployment, verify `/`, `/blog`, one article, one playlist, `/privacy`, `/terms`, and an unknown URL. Confirm that the unknown URL remains a real `404`. Complete one newsletter and contact submission with controlled test addresses, then remove the test records from Beehiiv and SheetDB.

## Rollback

Use the Cloudflare Pages deployment history to restore the last verified deployment when an immediate rollback is required. Then revert the release commit without rewriting shared history:

```bash
git revert <release-commit>
git push
```

Run `npm run release:check` on the revert before deployment. If a content-only defect is isolated and the previous deployment remains healthy, prefer a focused corrective commit over reverting unrelated fixes.
