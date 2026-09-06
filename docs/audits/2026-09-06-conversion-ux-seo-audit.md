# Ars Mosoris storefront audit: conversion, UX, SEO

Date: 2026-09-06. Scope: the Hydrogen storefront at https://arsmosoris.art (commit 6dcf5af).
Evidence: production HTML fetched with curl/Node, Lighthouse 12 mobile run through Brave, Storefront API catalogue query, and a read-through of `app/`.

## Measured baseline

Lighthouse mobile (simulated throttling), tested on the old `new.` host which now redirects, so real numbers are ~0.9 s better:

| Page | Perf | A11y | SEO | LCP | FCP | Transfer |
|---|---|---|---|---|---|---|
| Home | 63 | 86 | 100 | 11.7 s | 4.4 s | 2 390 KB |
| Product (Visions póló) | 63 | 89 | 100 | 8.2 s | 4.1 s | 1 199 KB |

LCP phases on home: TTFB 0.7 s, load delay 2.1 s, load 0.5 s, **render delay 8.4 s**. The LCP element is `div.hero-background`, whose `::before` paints `/logo.svg`.

Catalogue (Storefront API): 42 products, 1 real Shopify collection (`frontpage`), all products have descriptions (avg 167 chars) and SEO descriptions, 11 products have a single image, 0 images missing alt text.

Domains: `arsmosoris.art` is primary and serves 200; `new.arsmosoris.art` and `www` 301 to it; the Oxygen preview host `ars-mosoris-4ab8e9ebb71687e75aaf.o2.myshopify.dev` serves the full site with 200 and no noindex.

---

## 1. Performance (hurts ranking and conversion together)

| # | Finding | Where | Fix |
|---|---|---|---|
| P1 | `public/logo.svg` is 1 330 911 bytes (683 KB gzipped). Loaded by header, footer and as the hero watermark; it is the homepage LCP element and on the product page it delays first paint by ~7 s of render delay. SVGO with 1-decimal precision brings it to 179 KB (72 KB gz) with no visual change. | `Header.tsx:30`, `Footer.tsx:43`, `app.css:1593`, `app.css:6266` | Run SVGO; better still, serve a ~10 KB PNG/WebP for header/footer and a simplified vector for the watermark. Add `width`/`height` to both `<img>` tags (currently flagged as unsized). |
| P2 | Artist photos served at original size with no `srcset`: zorka 137 KB, zsolt 114 KB, emi 110 KB, dori 104 KB, gabor 293 KB. Lighthouse: 519 KB wasted on home. | `public/artists/*.jpg`, `_index.tsx` artists section | Resize to the rendered width ×2, convert to WebP, add `srcset`/`sizes`, `loading="lazy"`. |
| P3 | Render-blocking chain: `reset.css` (971 ms), Google Fonts CSS for Grandstander (907 ms), `app.css` 133 KB (300 ms). | `root.tsx:62-65`, `root.tsx:164` | Self-host the Grandstander woff2 with `rel=preload` and an inline `@font-face`; inline `reset.css`. |
| P4 | Hero/first images lack `fetchpriority="high"` and dimensions: collection hero, artist portrait, homepage drop cards (raw `<img>`, no srcset). | `collections.$handle.tsx:110-114`, `artists.$handle.tsx:60`, `_index.tsx:289-292` | Eager + high priority on the first hero image; dimensions everywhere. |
| P5 | Catalogue routes query `products(first: 250)` and serialise every node into SSR HTML (121 KB on `/collections/all`). | `collections.all.tsx:256`, `collections.$handle.tsx:236` | Use `getPaginationVariables` + `PaginatedResourceSection` (already used by blogs). |
| P6 | Header query is awaited as critical data but the result is never used; nav is hardcoded. | `root.tsx:113-121`, `Header.tsx:70` | Drop the query or use `menu?.items ?? FALLBACK`. |

## 2. SEO

| # | Finding | Where | Fix |
|---|---|---|---|
| S1 | **No `<link rel="canonical">` on any page.** Variant URLs (`?Méret=M&Szín=Fekete`), filter/sort URLs (`?type=`, `?artist=`, `?sort=`), cursor pagination and the Oxygen preview host are all indexable duplicates. | all routes; `products.$handle.tsx:83` computes `canonicalUrl` but never emits it | Shared helper emitting `SITE_URL + pathname` as canonical in every indexable route. Add `X-Robots-Tag: noindex` in `server.ts` for hosts other than `arsmosoris.art`. |
| S2 | **`/og-default.png` returns 404 in production.** Every route's `og:image` and the Organization `logo` point at it. Share cards on Facebook/Instagram/Messenger are blank. 9 routes still hardcode `https://new.arsmosoris.art/og-default.png`; 4 use a relative path scrapers reject. | `root.tsx:178`, `blogs.*`, `collections.$handle.tsx:12`, `events._index.tsx:12`, `policies.*`, `search.tsx:22`, `wishlist.tsx:14`, `about.tsx:14`, `contact.tsx:34`, `artists.*` | Create a 1200×630 `public/og-default.png`; replace all literals with `${SITE_URL}/og-default.png`; per-artist OG from `SITE_URL + artist.image`. |
| S3 | Sitemap gaps: `sitemap.custom.xml` (about, contact, events, artists) is never registered in the index; article URLs are built as `/articles/{handle}` (404); collections sitemap lists only `frontpage`; blog/article sitemaps effectively empty. | `[sitemap.xml].tsx:8-11`, `sitemap.$type.$page[.xml].tsx:13-15` | Pass `customChildSitemaps`; special-case articles to `/blogs/{blog}/{handle}`; add artists, `/collections/all`, policies to the custom sitemap. |
| S4 | robots.txt blocks `/policies/` (the site's own footer-linked policy pages) and `sort_by` (unused), but not `/wishlist`, `/penztar`, `/api/`, `/discount/`, nor the `?sort=`/`?type=`/`?artist=` facets. | `[robots.txt].tsx:80-98` | Adjust the rules to this app's URLs. |
| S5 | Structured data: Product+Offer and BreadcrumbList on PDP are good. Missing: `WebSite`+`SearchAction`, `ItemList` on catalogue/artist pages, BreadcrumbList outside PDP, `BlogPosting`, Organization `sameAs` (social links already in config), `priceValidUntil`/`itemCondition` on offers. | `root.tsx:170-181`, `products.$handle.tsx:285-361`, collection routes | Add these blocks; they are cheap. |
| S6 | Only one Shopify collection exists. Categories are query filters on `/collections/all`, so there is no crawlable, titled landing page for "póló", "kapucnis pulóver", "kabát", or per artist. | catalogue data; `collections.all.tsx:116-168` | Create real collections (by product type and by artist) via the Admin API, link them from nav/footer/home, and let them carry unique titles, descriptions and ItemList schema. Biggest content lever available. |
| S7 | Every page renders three hidden asides as `<main>` + `<h3>` (KOSÁR, KERESÉS, MENÜ) before the page `<h1>`, giving 4 `<main>` landmarks and headings out of order; CMS pages nest a 5th `<main>`. | `Aside.tsx:56-73`, `PageLayout.tsx:49-60`, `pages.$handle.tsx:88` | Return `null` from `Aside` when closed; use `<div>` inside. |
| S8 | Heading skips: h1 → h3 product cards, h4 footer headings, h5 in predictive search. Search page and results are entirely English ("Search", "Articles", "No results…"). | `ProductItem.tsx:71`, `Footer.tsx:86-108`, `search.tsx:53-65`, `SearchResults*.tsx` | Promote card titles to h2 (or add h2 section headings), translate search UI. |
| S9 | Head basics missing: `og:locale` (hu_HU), `og:site_name`, `theme-color`, `apple-touch-icon`, manifest, default title/description fallback. Routes without `meta` (404, penztar, discount, account) lack `noindex`. | `root.tsx:159-167`, `$.tsx`, `account.tsx` | Add to root meta/links; `noindex` on utility routes. |
| S10 | Artist and type filters push free text into the Shopify `query` ("Dóri" matches any mention, "Ars Mosoris" matches everything). | `collections.all.tsx:59-62`, `artists.$handle.tsx:38` | Use `vendor:"…"`, `product_type:…`, `tag:…`. |

## 3. Conversion

| # | Finding | Where | Fix |
|---|---|---|---|
| C1 | **The "second tee at 50 %" campaign is invisible** until a second Baseline/Visions tee is already in the cart. No announcement bar, no PDP badge, no cart nudge, no homepage mention. | `discounts.ts`, `CartSummary.tsx:65-79`, `_index.tsx` | Announcement strip site-wide; "2. póló −50 %" badge on eligible PDPs and cards; cart nudge "Tegyél mellé még egy pólót, a másodikat féláron adjuk" with one-click add of the other colour/size. |
| C2 | PDP gives no shipping, delivery time, returns, material or care info before add-to-cart. Those facts exist only on the policy and contact pages (2–5 days, 1 290/1 590 Ft, free over 30 000 Ft, 14-day return). | `products.$handle.tsx:230-259` | Trust strip under the add-to-cart button with 4 icons. Values need confirming with the owner. |
| C3 | Cart: no free-shipping progress ("Még 6 000 Ft az ingyenes szállításig"); coupon and gift-card inputs always open above the CTA; checkout link is a bare anchor with no payment/Foxpost marks or "biztonságos fizetés" note, and it leaves the site through 3 redirects. | `CartSummary.tsx:56-92`, `:133-145`, `:216-228` | Progress line; collapse coupon behind "Van kuponkódom?"; drop gift cards; trust row under CTA. |
| C4 | No scarcity signal possible: `quantityAvailable` is never queried although most items are 1–3 pieces. | variant fragment `products.$handle.tsx:580-613` | Query it; show "Már csak 1 db" / "Utolsó darab" under the size row. |
| C5 | After kosR checkout the Hydrogen cart is never cleared and there is no thank-you route; the badge still shows the bought items. | `penztar.tsx`, `kosr.ts:44-53` | Add `/koszonjuk` that clears the cart and shows next steps; set it as kosR's return URL. |
| C6 | Hero shows brand name, slogan, two buttons and a marquee, no product, price or offer. | `_index.tsx:164-205` | Put a product or the campaign in the hero. |
| C7 | Newsletter form creates a Shopify customer with `acceptsMarketing: true` from an e-mail alone: no consent checkbox or privacy link. Copy typo "értesíted lesz" (should be "értesítünk"); "Nyerj havonta ingyenes ruhát!" promises a draw with no rules. | `_index.tsx:79-97`, `:371`, `:379`, `:384-395` | Consent line + privacy link; fix typo; back the promise with rules or remove it. |
| C8 | Footer has no company identity (name, tax number, address) and no payment/shipping marks. | `Footer.tsx:123-130` | Add legal identity and marks (values from owner). |
| C9 | One hardcoded S–XXL chest/length table serves all 42 products including hoodies, trousers, jackets and one-offs. | `products.$handle.tsx:392-451` | Per-product-type tables, or hide the table where measurements are unknown. |
| C10 | Related products are same-artist only (can render a single card); recently-viewed strip appears after one view. Empty-cart suggestions are just the 4 newest products. | `products.$handle.tsx:68-80`, `:264`, `api.featured-products.tsx:14` | Cross-sell by type/price band; threshold ≥ 2; use wishlist/recently viewed for suggestions. |
| C11 | Sticky bar and empty-cart suggestions print "12 000 HUF" via `toLocaleString`, unlike the rest of the site ("12 000 Ft"), with the same hydration risk `formatMoney` was written to remove. | `products.$handle.tsx:150`, `CartMain.tsx:185` | Use `formatMoney`. |
| C12 | Add-to-cart shows "Kosárba helyezve!" even when Shopify returns a warning (out of stock, quantity capped); toast and drawer fire together. | `AddToCartButton.tsx:22-31`, `cart.tsx:98` | Surface warnings; keep one feedback channel. |

Verified OK: the automatic discount does survive the kosR handoff (checkout showed it in the earlier live test), so no action there.

## 4. UX and accessibility

| # | Finding | Where | Fix |
|---|---|---|---|
| U1 | **No navigation between 768 and 1023 px.** Desktop menu only ≥ 1024, bottom nav only ≤ 767, and the hamburger is hidden by both a `max-width: 1023px` and a `min-width: 1024px` rule, so `MobileMenuAside` is unreachable on every viewport. | `app.css:241-245`, `:343-352`, `:5456-5477` | Delete the `max-width: 1023px` hide rule. |
| U2 | 404 page is the raw error boundary: "Oops 404 /path not found", English, no header/footer/search, zero links. | `root.tsx:212-235`, `$.tsx` | Branded Hungarian 404 inside the layout with search and featured products. |
| U3 | Contrast 4.19:1 on muted text, card prices, breadcrumbs, artist link, size-guide trigger (needs 4.5). | `--color-muted` in `app.css` | Darken the muted token one step. |
| U4 | No `:focus-visible` style anywhere and `outline: none` in 8 places; keyboard users get no focus ring on forms. | `app.css:739, 1533, 3467, 3771, 4119, 4286, 4641, 5252` | One global `:focus-visible` rule. |
| U5 | Header account and cart icon links have no accessible name; footer uses h4; mailto link not distinguishable from text. | `Header.tsx` ctas, `Footer.tsx:86-108` | `aria-label`s, heading levels, link underline. |
| U6 | Cart drawer quantity and remove buttons are 28 × 28 px; wishlist heart 32 px; header icons ~36 px (44 px target). | `app.css:1319-1350`, `:5175`, `:304-309` | Enlarge hit areas. |
| U7 | Cookie consent is not re-sent to Shopify on return visits and can be lost if the Customer Privacy script isn't loaded when the visitor clicks; the banner then never returns. | `CookieConsent.tsx:21-40`, `root.tsx:87-94` | Re-apply stored consent on mount; wait for `customerPrivacy` before persisting. |
| U8 | Mobile stacking: cookie banner covers the sticky add-to-cart bar on first visit; toast, banner, sticky bar and bottom nav all compete at the bottom edge. | `app.css:5301-5477`, `:5629-5635` | Move the banner above the sticky bar or make it a compact top strip. |
| U9 | Three permanently mounted `role="dialog" aria-modal="true"` containers with no focus trap or focus restore. | `Aside.tsx:39-73` | Conditional render + focus management (same fix as S7). |
| U10 | Artist pages silently cap at 8 products with no "load more"; pagination variables computed then discarded. | `artists.$handle.tsx:34-46` | Use `PaginatedResourceSection`. |
| U11 | English leftovers: `aria-label="Open menu"`, `"Search"`, `"Close"`, footer heading "Shop", nav item "Shop". | `Header.tsx:125,138,242`, `Aside.tsx:62,66`, `Footer.tsx:86`, `PageLayout.tsx:212` | Translate. |
| U12 | Product description HTML has almost no styling (lists/headings render flat). | `app.css:1022-1025` | Add `.product-description` typography rules. |

---

## Status

**Batch 1 shipped 2026-09-06** (commits 2024a1d and the follow-up). Lighthouse mobile after deploy: home 63 → 80 (LCP 11.7 s → 3.9 s, 2 390 KB → 797 KB), product 63 → 88 (LCP 8.2 s → 3.1 s), accessibility 86 → 96. Remaining performance items: `app.css` (133 KB) is the only render-blocking resource; artist cards on phones could use a 320 px rendition.

Learned on the way: Oxygen serves `public/` images through Shopify's CDN, which re-encodes them (WebP sources come back as PNG/JPEG, `?format=`/`?width=` are ignored) and serves `public/fonts` from `cdn.shopify.com`, so `font-src` must allow that host. The custom sitemap route file `sitemap.custom[.xml].tsx` is served at `/sitemap/custom.xml`. Meta from a route whose loader throws is not applied; error pages get their head tags from the root `meta`.

**Batches 2 and 3 shipped 2026-09-06** (same day, second push), with assumptions where owner input was missing:

- Six smart collections created and published via the Admin API: `polok`, `puloverek`, `kabatok`, `nadragok-es-szoknyak`, `egyedi-darabok` (tag `second-hand`) and the campaign collection `nyitasi-akcio` (tag `akcio`, applied to Baseline and Visions). They carry cover images, descriptions and SEO fields, feed the homepage "Válogatott sorozataink" section, the footer, the collection page chips and the header "Kollekciók" item.
- Campaign surfacing: announcement bar, hero link, card badge, product-page note, cart nudge when exactly one eligible tee is in the cart. All switch off after `CAMPAIGN.endsAt` (2026-09-30) in `app/lib/config.ts`.
- Product page: trust strip (facts from `SHIPPING` in config.ts, taken from the shop's own policy page: GLS 1 290 / 1 590 Ft, free over 30 000 Ft, 1–2 + 2–3 workdays, 14-day return), size guide by product type (measured table only for tees; hoodies and one-offs get an honest note), "Már csak N db" scarcity line that appears once the Hydrogen channel's Storefront API gets the *read product inventory* permission, cross-sell filled by product type when an artist has fewer than four pieces.
- Cart: free-shipping progress bar, coupon field collapsed behind "Van kuponkódod?", gift-card field removed, trust note under the checkout button, "already ordered? empty the cart" notice after a checkout hand-off (session flag set in `/penztar`, cleared by a new add or by `/koszonjuk`).
- `/koszonjuk` thank-you page that empties the Hydrogen cart. **Owner action:** set `https://arsmosoris.art/koszonjuk` as the post-order return URL in the kosR app.
- Newsletter: required consent checkbox with privacy link, "értesíted" typo fixed, the monthly-draw promise replaced by a plain value line (restore it only with published rules).
- Footer: shipping/return/payment line. Company name and tax number are still missing (owner input).

**Promotions are now read from Shopify (later the same day).** `app/lib/campaigns.server.ts` fetches the shop's active automatic discounts through the Admin API (client-credentials token from `SHOPIFY_ADMIN_CLIENT_ID` / `SHOPIFY_ADMIN_CLIENT_SECRET`, memoised for 5 minutes) and `app/lib/campaigns.ts` turns them into Hungarian copy for the announcement bar, hero link, card badges, product note, cart nudge and the `/akcio` landing page. Buy-X-get-Y, percentage/amount and free-shipping automatic discounts are supported; product and collection scopes are expanded to product ids, so no tags or config are needed. The discount's *title* is customer-facing copy (renamed to "Nyitási akció"). The tag-based campaign collection and the `akcio` tags were removed; the default `frontpage` collection was unpublished from the Hydrogen channel so it no longer appears on `/collections`. **Owner action:** add the two env vars to the Oxygen production environment (values are the custom app's client id/secret, the same as `WRITE_INVENTORY_*` in `.env`); until then the storefront shows no campaign surfaces.

**All shop content moved to Shopify data (later still).** `app/lib/content.ts` reads, through the Storefront API: the `shop_settings` metaobject (shipping prices/times, return days, payment text, contact e-mail, socials, tagline, product-page USP, company name/address/tax number), `size_guide` metaobjects (matched by product type, or per product via the `custom.size_guide` metafield; table rows plus a note with a `{sizes}` placeholder), `artist` metaobjects (portraits in Shopify Files), the published collections (category chips, footer, home ordering) and the `hydrogen-main` / `hydrogen-footer` menus. The constants in `config.ts` / `artists.ts` are fallbacks only. `scripts/seed-content.cjs` creates the definitions, entries and menus; it needs the custom app to get the scopes `write_metaobject_definitions`, `write_metaobjects`, `write_online_store_navigation`, `write_files`. After that, everything is edited in the admin under Content → Metaobjects and Online Store → Navigation.

Seeded the same evening: the definitions, entries and menus exist in the shop, the Admin API credentials are in Oxygen (campaign banner live). Portraits stay in `public/artists/` until the app also gets the Files write scope.

Still open from the audit: catalogue pagination (not needed under ~50 products), per-type measurements for hoodies (now a metaobject field), payment-method logos (which methods does kosR offer?), hero product visual, `app.css` size.

## Suggested order of work

**Batch 1: technical, no decisions needed (about a day).** P1–P4, S1–S5, S7–S10, U1–U7, U9–U12, C11, C12.

**Batch 2: conversion, needs copy and numbers from the owner.** C1 campaign surfacing, C2 trust strip, C3 cart changes, C4 scarcity, C7 newsletter, C8 footer identity, C6 hero.

**Batch 3: structure.** S6 real collections (I can create them via the Admin API), P5/U10 pagination, C5 thank-you route (needs the return URL set in kosR), C9 per-type size guides, C10 cross-sell.

## Inputs needed from the owner

- Shipping facts to print on the PDP and cart: delivery time, Foxpost/home-delivery prices, free-shipping threshold (policy page says 1 290 / 1 590 Ft, free above 30 000 Ft, 2–5 days, 14-day return).
- Payment methods offered through kosR (card provider, utánvét) for the trust marks.
- Company name, seat and tax number for the footer.
- Announcement-bar copy for the campaign, and whether "Nyerj havonta ingyenes ruhát" is a real draw.
- Real measurements per product type, or approval to hide the table where unknown.
- Collection structure approval: by type (Pólók, Pulóverek, Kabátok, Nadrágok, Táskák, Egyedi darabok) and by artist.
