import {describe, expect, it} from 'vitest';
import {absoluteUrl, breadcrumbJsonLd, jsonLd, seoMeta, truncate} from './seo';

describe('absoluteUrl', () => {
  it('resolves site paths on the public origin and keeps absolute URLs', () => {
    expect(absoluteUrl('/products/bika-polo')).toBe('https://arsmosoris.art/products/bika-polo');
    expect(absoluteUrl('og.png')).toBe('https://arsmosoris.art/og.png');
    expect(absoluteUrl('https://cdn.shopify.com/a.jpg')).toBe('https://cdn.shopify.com/a.jpg');
  });
});

describe('truncate', () => {
  it('cuts on a word boundary with an ellipsis', () => {
    const out = truncate('szó '.repeat(60), 50);
    expect(out.length).toBeLessThanOrEqual(50);
    expect(out.endsWith('…')).toBe(true);
    expect(out).not.toMatch(/\s…$/);
  });

  it('collapses whitespace and leaves short text alone', () => {
    expect(truncate('  egy   kettő ')).toBe('egy kettő');
  });
});

describe('seoMeta', () => {
  it('adds the site suffix and a canonical without the query string', () => {
    const tags = seoMeta({title: 'Bika póló', path: '/products/bika-polo?Méret=M'});
    expect(tags).toContainEqual({title: 'Bika póló | Ars Mosoris'});
    expect(tags).toContainEqual({
      tagName: 'link',
      rel: 'canonical',
      href: 'https://arsmosoris.art/products/bika-polo',
    });
    expect(tags).toContainEqual({
      property: 'og:image',
      content: 'https://arsmosoris.art/og-default.png',
    });
  });

  it('gives utility pages noindex and no canonical', () => {
    const tags = seoMeta({title: 'Kosár', path: '/cart', noindex: true});
    expect(tags).toContainEqual({name: 'robots', content: 'noindex'});
    expect(tags.some((t) => 'rel' in t && t.rel === 'canonical')).toBe(false);
  });
});

describe('structured data helpers', () => {
  it('escapes < so a product text cannot close the script tag', () => {
    expect(jsonLd({name: '</script><b>'})).not.toContain('</script>');
  });

  it('numbers the breadcrumbs and leaves the last one without a link', () => {
    const crumbs = breadcrumbJsonLd([
      {name: 'Katalógus', path: '/collections/all'},
      {name: 'Akciók'},
    ]);
    expect(crumbs.itemListElement).toEqual([
      {
        '@type': 'ListItem',
        position: 1,
        name: 'Katalógus',
        item: 'https://arsmosoris.art/collections/all',
      },
      {'@type': 'ListItem', position: 2, name: 'Akciók'},
    ]);
  });
});
