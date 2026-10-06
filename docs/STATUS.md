# ARS status

Updated 2026-10-06. Scope for this repo is DevOps only.

## Where things stand

- **Production** (`main`, deployed to Oxygen at https://arsmosoris.art): commit `30c4d57`, 2026-09-06.
  It includes audit batches 1–3, Shopify-driven campaigns and content, and the size filter.
  See `docs/audits/2026-09-06-conversion-ux-seo-audit.md`.
- **`fix/audit-quick-wins`** (13 commits, pushed, preview deployed, CI green 2026-09-29): Hungarian
  storefront context, newsletter/contact/search/cart fixes, a lint and typecheck that pass, CI workflow,
  `.nvmrc`, `.env.example`, README.
- **`fix/audit-batch-2`** (47 commits, a superset of quick-wins, **not pushed**): a11y (focus traps,
  skip link, radiogroups), SEO (robots, trailing-slash 301, sitemap events, Product JSON-LD), pagination
  at 24, Dependabot, prettier scripts, a CI step that fails on GraphQL codegen drift.
  Checked locally 2026-10-06: lint has 0 errors (19 `no-console` warnings), typecheck and build pass.

## Blocked

- Pushing `fix/audit-batch-2` is rejected because it edits `.github/workflows/ci.yml` and the git
  credential lacks the `workflow` scope. Fix: `gh auth refresh -h github.com -s workflow`, then
  `gh auth setup-git`, then push.

## Next

1. Push `fix/audit-batch-2`, open a PR to `main`, wait for the CI and preview deploy, smoke-test the preview.
2. Merge to `main` (this deploys production). Then delete `fix/audit-quick-wins`, `kosr-checkout` and
   `shopify-setup-oxygen-workflow-xyl6` (all merged or stale) and remove the two worktrees.
3. Triage the first Dependabot PRs.

## Health check 2026-10-06

1. **The site is private.** Every URL on https://arsmosoris.art (home, robots.txt, sitemap) 302-redirects
   to a Shopify account login (`accounts.shopify.com/oauth/authorize`, via `cf-auth-worker`). On 2026-09-06
   it was public. Shoppers and Google cannot reach the shop. Fix in Shopify admin → Hydrogen → Ars Mosoris →
   Storefront settings → Environments and variables → Production → URL privacy: **Public**.
2. **react-router 7.13.0 in production** has high-severity advisories, including unauthenticated RCE
   through turbo-stream deserialisation (GHSA-49rj-9fvp-4h2h, GHSA-337j-9hxr-rhxg) and open redirects.
   Fixed in 7.18.2+. Hydrogen 2026.4.7 (latest) declares `react-router ~7.16.0`, so the fix means running
   7.18.x with an npm override ahead of Hydrogen's range. Build it on a branch and smoke-test the preview.
3. Dev-only advisories (codegen, mini-oxygen, vite, Shopify CLI) are not in the deployed worker. They are
   cleared by the minor/patch Dependabot group and a later Hydrogen upgrade.
4. Security headers: only HSTS and `nosniff` are sent. Add `Referrer-Policy`, `X-Frame-Options` /
   `frame-ancestors` and `Permissions-Policy` in `server.ts` (CSP already exists from Hydrogen).
5. Oxygen preview hosts send no `X-Robots-Tag: noindex` (audit S1). They are private today, but add it in
   `server.ts` for hosts other than `arsmosoris.art`.
6. Lint: 19 `no-console` warnings. Use `console.warn`/`error` or remove the calls.
7. Still open from the audit: payment logos, hero product visual, `app.css` size (133 KB render-blocking).

## Owner actions still open

- Set `https://arsmosoris.art/koszonjuk` as the post-order return URL in kosR.
- Payment methods offered through kosR (for trust marks); company name, address and tax number in the
  `shop_settings` metaobject.
- Give the custom app the Files write scope so the artist portraits can move to Shopify Files.
