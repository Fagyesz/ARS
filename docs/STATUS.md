# ARS status

Updated 2026-10-06. Scope for this repo is DevOps only.

## Where things stand

- **Production** (`main`, Oxygen, https://arsmosoris.art, **private until launch**): PR #2 merged 2026-10-06
  (`0504dd7`). It holds audit batches 1–3, Shopify-driven campaigns and content, the size filter, and the
  2026-09-29 fixes (a11y, SEO, cart, pagination). CI runs lint, a codegen drift check, typecheck and build
  on every push and PR. Dependabot checks npm and Actions weekly.
- All other branches and worktrees have been removed. GitHub CLI token has the `workflow` scope.

## Next (before launch)

1. Owner updates the product list in Shopify.
2. End-to-end test on production while it is private: browse, filter, product, cart, coupon, kosR checkout,
   FoxPost, `/koszonjuk`, newsletter, contact form, account login.
3. react-router security upgrade (item 2 below), on a branch, verified on its preview.
4. Switch production to Public.

## Health check 2026-10-06

1. **The site is private on purpose** (owner, 2026-10-06): every URL redirects to a Shopify account login
   until the product list is updated and the whole purchase flow is tested. To launch: Shopify admin →
   Hydrogen → Ars Mosoris → Environments → Production → URL privacy: **Public**.
2. **react-router 7.13.0 in production** has high-severity advisories, including unauthenticated RCE
   through turbo-stream deserialisation (GHSA-49rj-9fvp-4h2h, GHSA-337j-9hxr-rhxg) and open redirects.
   Fixed in 7.18.2+. Hydrogen 2026.4.7 (latest) declares `react-router ~7.16.0`, so the fix means running
   7.18.x with an npm override ahead of Hydrogen's range. Build it on a branch and smoke-test the preview.
3. Dev-only advisories (codegen, mini-oxygen, vite, Shopify CLI) are not in the deployed worker. They are
   cleared by the minor/patch Dependabot group and a later Hydrogen upgrade.
4. Security headers: only HSTS and `nosniff` are sent. Add `Referrer-Policy`, `X-Frame-Options` /
   `frame-ancestors` and `Permissions-Policy` in `server.ts` (CSP already exists from Hydrogen).
5. SEO and shopper QoL gaps: see `docs/audits/2026-10-06-seo-qol-gaps.md`.
6. Lint: 19 `no-console` warnings. Use `console.warn`/`error` or remove the calls.
7. Still open from the audit: payment logos, hero product visual, `app.css` size (133 KB render-blocking).

## Owner actions still open

- Set `https://arsmosoris.art/koszonjuk` as the post-order return URL in kosR.
- Payment methods offered through kosR (for trust marks); company name, address and tax number in the
  `shop_settings` metaobject.
- Give the custom app the Files write scope so the artist portraits can move to Shopify Files.
