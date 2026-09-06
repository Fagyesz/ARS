import type {MetaDescriptor} from 'react-router';
import {SITE_URL} from './config';

export const SITE_NAME = 'Ars Mosoris';
export const DEFAULT_DESCRIPTION =
  'Négy képzőművész által alapított márka, ahol a mindennapi viselet és a kortárs művészet találkozik. Kézzel nyomott pólók, pulóverek és egyedi darabok.';
export const DEFAULT_OG_IMAGE = `${SITE_URL}/og-default.png`;

type SeoInput = {
  /** Page title without the site suffix */
  title: string;
  description?: string | null;
  /** Path of the page, usually `location.pathname`; any query string is dropped for the canonical */
  path: string;
  /** Absolute URL preferred; a site-relative path is resolved against SITE_URL */
  image?: string | null;
  type?: 'website' | 'article' | 'product';
  /** Utility pages (cart, search, wishlist…) get `noindex` and no canonical */
  noindex?: boolean;
  /** Use the title as is, without " | Ars Mosoris" (home page) */
  rawTitle?: boolean;
};

/** Resolve a site-relative path to an absolute URL on the public origin. */
export function absoluteUrl(pathOrUrl: string): string {
  if (/^https?:\/\//.test(pathOrUrl)) return pathOrUrl;
  return `${SITE_URL}${pathOrUrl.startsWith('/') ? '' : '/'}${pathOrUrl}`;
}

/** Cut long copy to a meta-description length on a word boundary. */
export function truncate(text: string, max = 160): string {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (clean.length <= max) return clean;
  const cut = clean.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(' '), 80))}…`;
}

/**
 * Hydrogen's sitemap helpers build every URL from the request origin. Rebase
 * the request on the public origin so preview hosts never advertise themselves.
 */
export function requestOnPublicOrigin(request: Request): Request {
  const url = new URL(request.url);
  return new Request(`${SITE_URL}${url.pathname}${url.search}`, request);
}

/**
 * Complete head tags for a page: title, description, canonical, Open Graph and
 * Twitter cards, all on the fixed public origin so preview hosts and query-string
 * variants (sizes, filters, sorting) never become their own indexable pages.
 */
export function seoMeta({
  title,
  description,
  path,
  image,
  type = 'website',
  noindex = false,
  rawTitle = false,
}: SeoInput): MetaDescriptor[] {
  const fullTitle = rawTitle ? title : `${title} | ${SITE_NAME}`;
  const url = absoluteUrl(path.split('?')[0]);
  const desc = truncate(description || DEFAULT_DESCRIPTION);
  const ogImage = absoluteUrl(image || '/og-default.png');

  const tags: MetaDescriptor[] = [
    {title: fullTitle},
    {name: 'description', content: desc},
    {property: 'og:type', content: type},
    {property: 'og:title', content: fullTitle},
    {property: 'og:description', content: desc},
    {property: 'og:image', content: ogImage},
    {property: 'og:url', content: url},
    {name: 'twitter:card', content: 'summary_large_image'},
    {name: 'twitter:title', content: fullTitle},
    {name: 'twitter:description', content: desc},
    {name: 'twitter:image', content: ogImage},
  ];

  if (noindex) {
    tags.push({name: 'robots', content: 'noindex'});
  } else {
    tags.push({tagName: 'link', rel: 'canonical', href: url});
  }

  return tags;
}

/**
 * Serialise structured data for a `<script type="application/ld+json">`.
 * `<` is escaped so a stray `</script>` in a product text can't break out.
 */
export function jsonLd(data: unknown): string {
  return JSON.stringify(data).replace(/</g, '\\u003c');
}

/** schema.org BreadcrumbList; the last item may omit `path` (current page). */
export function breadcrumbJsonLd(items: Array<{name: string; path?: string}>) {
  return {
    '@context': 'https://schema.org',
    '@type': 'BreadcrumbList',
    itemListElement: items.map((item, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: item.name,
      ...(item.path ? {item: absoluteUrl(item.path)} : {}),
    })),
  };
}

/** schema.org ItemList of product links for catalogue, collection and artist pages. */
export function productListJsonLd(
  products: Array<{handle: string; title: string}>,
  limit = 24,
) {
  return {
    '@context': 'https://schema.org',
    '@type': 'ItemList',
    numberOfItems: products.length,
    itemListElement: products.slice(0, limit).map((product, index) => ({
      '@type': 'ListItem',
      position: index + 1,
      name: product.title,
      url: absoluteUrl(`/products/${product.handle}`),
    })),
  };
}
