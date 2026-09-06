import type {Storefront} from '@shopify/hydrogen';
import {EMAIL, SHIPPING, SOCIAL_LINKS} from './config';
import {ARTISTS, type Artist} from './artists';

/**
 * Shop-managed content. Everything here is read from Shopify through the
 * Storefront API — metaobjects (`shop_settings`, `size_guide`, `artist`), the
 * published collections and menus — so the owner edits it in the admin and
 * nothing needs a code change. The constants in config.ts / artists.ts are
 * only the fallback until the data exists (see scratchpad/seed-content.js).
 */

export type SiteSettings = {
  tagline: string;
  contactEmail: string;
  social: {instagram: string; facebook: string; tiktok: string; youtube: string};
  shipping: {
    carrier: string;
    parcelPointFt: number;
    homeDeliveryFt: number;
    freeOverFt: number;
    handlingDays: string;
    transitDays: string;
    returnDays: number;
  };
  /** free text shown in the cart and footer, e.g. "Bankkártya, utánvét" */
  paymentMethods: string;
  usp: {title: string; text: string};
  company: {name: string; address: string; taxNumber: string};
};

export type SizeGuide = {
  handle: string;
  title: string;
  /** product types this guide applies to (lower-cased) */
  productTypes: string[];
  columns: string[];
  rows: string[][];
  note: string;
};

export type ShopCollection = {handle: string; title: string};

export type SiteContent = {
  settings: SiteSettings;
  sizeGuides: SizeGuide[];
  artists: Artist[];
  collections: ShopCollection[];
};

export const FALLBACK_SETTINGS: SiteSettings = {
  tagline:
    'Négy képzőművész által alapított márka, ahol a mindennapi viselet és a kortárs művészet találkozik.',
  contactEmail: EMAIL,
  social: {...SOCIAL_LINKS},
  shipping: {
    carrier: SHIPPING.carrier,
    parcelPointFt: SHIPPING.parcelPointFt,
    homeDeliveryFt: SHIPPING.homeDeliveryFt,
    freeOverFt: SHIPPING.freeOverFt,
    handlingDays: SHIPPING.handlingDays,
    transitDays: SHIPPING.transitDays,
    returnDays: SHIPPING.returnDays,
  },
  paymentMethods: 'Biztonságos online fizetés',
  usp: {title: 'Kézzel készül Budapesten', text: 'kis szériás, egyedi grafika'},
  company: {name: '', address: 'Budapest, Magyarország', taxNumber: ''},
};

/** Used until size_guide metaobjects exist; mirrors what the shop showed so far */
export const FALLBACK_SIZE_GUIDES: SizeGuide[] = [
  {
    handle: 'polo',
    title: 'Mérettáblázat',
    productTypes: ['póló'],
    columns: ['Méret', 'Mellbőség', 'Hossz'],
    rows: [
      ['S', '96 cm', '68 cm'],
      ['M', '102 cm', '71 cm'],
      ['L', '108 cm', '74 cm'],
      ['XL', '114 cm', '76 cm'],
      ['XXL', '120 cm', '78 cm'],
    ],
    note: 'Unisex szabás; a mellbőség a hónaljnál mért teljes körméret. Ha két méret között vagy, a nagyobbat javasoljuk.',
  },
  {
    handle: 'pulover',
    title: 'Méretek és szabás',
    productTypes: ['kapucnis pulóver', 'környakú pulóver'],
    columns: [],
    rows: [],
    note: 'Unisex, bő szabású pulóver, elérhető méretek: {sizes}. Ha bizonytalan vagy, írj nekünk, és lemérjük neked a konkrét darabot.',
  },
  {
    handle: 'egyedi',
    title: 'Méretek és szabás',
    productTypes: ['kabát', 'blézer', 'ing', 'blúz', 'szoknya', 'nadrág', 'short'],
    columns: [],
    rows: [],
    note: 'Egyetlen példányban készült darab, mérete: {sizes}. Pontos méreteket szívesen küldünk: írj nekünk a termék nevével.',
  },
];

type Field = {key: string; value?: string | null; reference?: unknown};
type MetaobjectNode = {handle: string; fields: Field[]};

function fieldMap(fields: Field[] | null | undefined): Record<string, string> {
  const map: Record<string, string> = {};
  for (const f of fields ?? []) if (f.value != null && f.value !== '') map[f.key] = f.value;
  return map;
}

const num = (value: string | undefined, fallback: number) => {
  const n = value === undefined ? NaN : Number(String(value).replace(/[^\d.-]/g, ''));
  return Number.isFinite(n) ? n : fallback;
};

export function toSettings(node: {fields: Field[]} | null | undefined): SiteSettings {
  if (!node) return FALLBACK_SETTINGS;
  const f = fieldMap(node.fields);
  const d = FALLBACK_SETTINGS;
  return {
    tagline: f.tagline ?? d.tagline,
    contactEmail: f.contact_email ?? d.contactEmail,
    social: {
      instagram: f.instagram ?? d.social.instagram,
      facebook: f.facebook ?? d.social.facebook,
      tiktok: f.tiktok ?? d.social.tiktok,
      youtube: f.youtube ?? d.social.youtube,
    },
    shipping: {
      carrier: f.shipping_carrier ?? d.shipping.carrier,
      parcelPointFt: num(f.parcel_point_price, d.shipping.parcelPointFt),
      homeDeliveryFt: num(f.home_delivery_price, d.shipping.homeDeliveryFt),
      freeOverFt: num(f.free_shipping_threshold, d.shipping.freeOverFt),
      handlingDays: f.handling_time ?? d.shipping.handlingDays,
      transitDays: f.transit_time ?? d.shipping.transitDays,
      returnDays: num(f.return_days, d.shipping.returnDays),
    },
    paymentMethods: f.payment_methods ?? d.paymentMethods,
    usp: {title: f.usp_title ?? d.usp.title, text: f.usp_text ?? d.usp.text},
    company: {
      name: f.company_name ?? d.company.name,
      address: f.company_address ?? d.company.address,
      taxNumber: f.tax_number ?? d.company.taxNumber,
    },
  };
}

const splitList = (value: string | undefined) =>
  (value ?? '')
    .split(/[,;\n]/)
    .map((s) => s.trim())
    .filter(Boolean);

export function toSizeGuide(node: MetaobjectNode): SizeGuide {
  const f = fieldMap(node.fields);
  return {
    handle: node.handle,
    title: f.title || 'Mérettáblázat',
    productTypes: splitList(f.product_type).map((t) => t.toLowerCase()),
    columns: splitList(f.columns),
    // one row per line, cells separated by commas or semicolons
    rows: (f.rows ?? '')
      .split('\n')
      .map((line) => line.split(/[,;]/).map((c) => c.trim()))
      .filter((cells) => cells.length > 1 && cells[0]),
    note: f.note ?? '',
  };
}

export function toSizeGuides(nodes: MetaobjectNode[] | null | undefined): SizeGuide[] {
  const guides = (nodes ?? []).map(toSizeGuide);
  return guides.length ? guides : FALLBACK_SIZE_GUIDES;
}

/** The guide for a product: explicit override first, then by product type */
export function findSizeGuide(
  guides: SizeGuide[],
  productType: string | null | undefined,
  override?: SizeGuide | null,
): SizeGuide | null {
  if (override) return override;
  const type = (productType ?? '').toLowerCase();
  return guides.find((g) => g.productTypes.includes(type)) ?? null;
}

type ImageRef = {image?: {url: string; width?: number | null; height?: number | null; altText?: string | null} | null};

export function toArtist(node: MetaobjectNode): Artist {
  const f = fieldMap(node.fields);
  const handle = f.slug || node.handle;
  const portraitField = node.fields.find((x) => x.key === 'portrait');
  const image = (portraitField?.reference as ImageRef | undefined)?.image;
  const sep = image?.url.includes('?') ? '&' : '?';
  // no portrait uploaded to Shopify yet: keep the built-in photo for that artist
  const builtIn = ARTISTS.find((a) => a.handle === handle);
  return {
    handle,
    name: f.name || node.handle,
    fullName: f.full_name || f.name || node.handle,
    role: f.role || 'Képzőművész',
    bio: f.bio || '',
    statement: f.statement || f.bio || '',
    instagram: f.instagram,
    collectionHandle: handle,
    vendor: f.vendor || f.name,
    image: image?.url ?? builtIn?.image,
    imageSize: image ? undefined : builtIn?.imageSize,
    portrait: image
      ? {
          src: `${image.url}${sep}width=960`,
          srcSet: `${image.url}${sep}width=480 480w, ${image.url}${sep}width=960 960w`,
          width: image.width ?? undefined,
          height: image.height ?? undefined,
        }
      : undefined,
  };
}

export function toArtists(nodes: MetaobjectNode[] | null | undefined): Artist[] {
  const artists = (nodes ?? []).map(toArtist).filter((a) => a.name && a.bio);
  return artists.length ? artists : ARTISTS;
}

export const SITE_CONTENT_QUERY = `#graphql
  query SiteContent($country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    settings: metaobject(handle: {type: "shop_settings", handle: "default"}) {
      fields {
        key
        value
      }
    }
    sizeGuides: metaobjects(type: "size_guide", first: 20) {
      nodes {
        handle
        fields {
          key
          value
        }
      }
    }
    artists: metaobjects(type: "artist", first: 20, sortKey: "sort") {
      nodes {
        handle
        fields {
          key
          value
          reference {
            ... on MediaImage {
              image {
                url
                width
                height
                altText
              }
            }
          }
        }
      }
    }
    collections(first: 20) {
      nodes {
        handle
        title
      }
    }
  }
` as const;

/** One cached Storefront round trip for all shop-managed content */
export async function loadSiteContent(storefront: Storefront): Promise<SiteContent> {
  try {
    const data = await storefront.query(SITE_CONTENT_QUERY, {
      cache: storefront.CacheLong(),
    });
    return {
      settings: toSettings(data.settings),
      sizeGuides: toSizeGuides(data.sizeGuides?.nodes),
      artists: toArtists(data.artists?.nodes as MetaobjectNode[]),
      collections: (data.collections?.nodes ?? []).filter((c) => c.handle !== 'frontpage'),
    };
  } catch (error) {
    console.error('[content] falling back to built-in content:', error);
    return {
      settings: FALLBACK_SETTINGS,
      sizeGuides: FALLBACK_SIZE_GUIDES,
      artists: ARTISTS,
      collections: [],
    };
  }
}
