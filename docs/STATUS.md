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

## Owner actions still open

- Set `https://arsmosoris.art/koszonjuk` as the post-order return URL in kosR.
- Payment methods offered through kosR (for trust marks); company name, address and tax number in the
  `shop_settings` metaobject.
- Give the custom app the Files write scope so the artist portraits can move to Shopify Files.
