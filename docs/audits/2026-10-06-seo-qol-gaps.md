# SEO and shopper QoL gaps

Date: 2026-10-06. Scope: `main` at `da36a83`. This was a code review only: production is private before
launch, and a local run needs the Oxygen env (`npx shopify hydrogen env pull` after a Shopify CLI login).
Re-check the rendered HTML once that is possible.

## Already in place

Every page gets title, description, canonical (query string dropped), Open Graph and Twitter tags from
`app/lib/seo.ts`. Utility pages and non-production hosts get `noindex`. robots.txt blocks cart, checkout,
account, search, wishlist and filter/sort URLs. Sitemaps cover products, collections, pages, artists,
event articles and policies. JSON-LD: Organization (with `sameAs`), WebSite + SearchAction, Product with
offers, shipping and return policy, BreadcrumbList, ItemList on collection and artist pages, BlogPosting.
The site has a branded 404 and `lang="hu"`, and all product handles are Hungarian.

Shopper features in place: predictive search, size filter and sort, size guide, scarcity line, compare-at
prices, wishlist, recently viewed, back-in-stock request, sticky add-to-cart, coupon feedback,
free-shipping progress (hidden while there is no free-shipping rate), FAQ on the contact page, skip link,
focus traps, cookie banner reopen link.

## SEO: what is missing

| # | Gap | Fix | Effort | Who |
|---|---|---|---|---|
| S1 | No Google Search Console and no Google Shopping listing. A new domain gets indexed slowly without them, and free Shopping listings are the largest traffic source for clothing. | At launch: verify `arsmosoris.art` in Search Console (DNS TXT), submit `/sitemap.xml`. Install Shopify's "Google & YouTube" channel for free listings in Merchant Center. | 1 h | owner + me |
| S2 | Product titles are thin ("Bika póló \| Ars Mosoris"). Most products have no custom SEO title, so search results do not show the artist or that the print is handmade. | When `seo.title` is empty, build `{title} – {artist} kézzel nyomott {type}` in `products.$handle.tsx` meta, and a description from the type, artist and first sentence. The owner can still override it per product. | 1 h | me |
| S3 | Product schema has one offer per product and no sizes or colours, so Google cannot show size/colour availability. | Emit `ProductGroup` with `hasVariant` (one `Product` per variant with `size`, `color`, own offer and availability), `variesBy` size/colour. | 2 h | me |
| S4 | No product reviews, so no star ratings in results and no `AggregateRating`. | Install a free review app (e.g. Judge.me), show its widget on the product page and add its rating to the JSON-LD. Needs the owner to want reviews. | 2–3 h | owner decides |
| S5 | `/collections/all` and `/akcio` have no ItemList or BreadcrumbList (collection and artist pages do). | Reuse `productListJsonLd` / `breadcrumbJsonLd`. | 30 min | me |
| S6 | Little indexable text: artist pages and the events blog are the only content. | Owner writes ~300 words per artist and one page on the print technique. Each is a page that can rank for the artist's name and "kézzel nyomott póló". | ongoing | owner |
| S7 | Route slugs are English (`/artists`, `/about`, `/contact`, `/events`) on a Hungarian site. | Optional: Hungarian slugs (`/muveszek`, `/rolunk`, `/kapcsolat`, `/esemenyek`) with 301s from the old ones. Do it before launch or not at all. | 2 h | decide |

## Shopper QoL: what is missing

| # | Gap | Fix | Effort |
|---|---|---|---|
| Q1 | **Back-in-stock is manual.** The form e-mails the owner and the shopper. Nobody is notified when the size comes back unless the owner remembers. | Store requests (metaobject `restock_request` or customer tag) and send the e-mail from a Shopify Flow on inventory change, or use a free restock app. | 3 h |
| Q2 | **No parcel tracking in the account.** The order page shows status and the order status link, but not the FoxPost tracking number or link. | Query `fulfillments.trackingInformation {number url}` and show "Csomag követése". | 1 h |
| Q3 | Delivery date is vague ("1–2 munkanap"). | Under add-to-cart: "Ha ma megrendeled, várható átvétel: okt. 8–9." Calculated from `shop_settings` times, skipping weekends. | 1 h |
| Q4 | No share button on product pages. Artist-made pieces get shared on Messenger and Instagram. | `navigator.share` with a copy-link fallback next to the wishlist heart. | 30 min |
| Q5 | Wishlist and recently viewed are per device (localStorage); a logged-in shopper loses them on another device. | Sync the wishlist to a customer metafield when logged in. | 3 h |
| Q6 | No web app manifest (apple-touch-icon exists). | `manifest.webmanifest` with the 144/512 logos and theme colour. | 15 min |
| Q7 | No price filter. | Not needed at ~42 products; revisit above ~100. | — |

## Suggested order

Before launch: S2, S5, Q2, Q3, Q4, Q6 (about half a day, all code, no owner input). Decide S7 now, because
changing slugs after launch costs rankings.
At launch: S1.
After launch: Q1, S3, S4 (once the owner decides on reviews), Q5, S6.
