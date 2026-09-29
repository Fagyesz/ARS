# Ars Mosoris storefront

Headless Shopify storefront for [arsmosoris.art](https://arsmosoris.art), built with
Hydrogen 2026.1 (React Router 7, Vite, Tailwind 4) and hosted on Shopify Oxygen.
The shop UI is Hungarian. Checkout is handed to kosR (`/penztar`), shipping is FoxPost.

## Setup

Requirements: Node.js 22 (see `.nvmrc`; at least 20.10 for the Shopify CLI).

```bash
npm ci
npx shopify hydrogen link       # link this repo to the Hydrogen storefront
npx shopify hydrogen env pull   # writes .env from the Oxygen environment
npm run dev
```

Without access to the Oxygen environment, copy `.env.example` to `.env` and fill in
the values instead. Never commit `.env`.

Shop-managed content (settings, size guides, artists, menus) lives in Shopify
metaobjects; `node scripts/seed-content.cjs [--apply]` creates their definitions.

## Scripts

| Command             | What it does                                         |
| ------------------- | ---------------------------------------------------- |
| `npm run dev`       | Local dev server with GraphQL codegen                |
| `npm run build`     | Production build (runs codegen first)                |
| `npm run preview`   | Build and serve the production bundle locally        |
| `npm run lint`      | ESLint                                               |
| `npm run typecheck` | React Router typegen + `tsc --noEmit`                |
| `npm run codegen`   | Regenerate Storefront / Customer Account API types   |

## Deployment and CI

- Every push is deployed to Oxygen by `.github/workflows/oxygen-deployment-*.yml`
  (which branch is production is set in the Hydrogen channel in Shopify admin).
- `.github/workflows/ci.yml` runs `npm run lint`, `npm run typecheck` and
  `npm run build` on every push and pull request.
