import {buildCopy, type Campaign, type CampaignKind} from './campaigns';

/**
 * Reads the shop's active automatic discounts through the Admin API and turns
 * them into storefront campaigns. Needs a custom-app client id/secret with
 * read access to discounts and products (SHOPIFY_ADMIN_CLIENT_ID /
 * SHOPIFY_ADMIN_CLIENT_SECRET in the Oxygen environment). Without them the
 * storefront simply shows no campaign surfaces.
 *
 * Results are memoised per worker for a few minutes so the banner does not
 * cost an Admin API round trip on every request.
 */
const API_VERSION = '2025-07';
const TTL_MS = 5 * 60 * 1000;

type Memo = {at: number; value: Campaign[]};
let memo: Memo | null = null;
let tokenMemo: {token: string; expiresAt: number} | null = null;

type AdminEnv = {
  PUBLIC_STORE_DOMAIN?: string;
  SHOPIFY_ADMIN_CLIENT_ID?: string;
  SHOPIFY_ADMIN_CLIENT_SECRET?: string;
  WRITE_INVENTORY_CLIENT_ID?: string;
  WRITE_INVENTORY_SECRET?: string;
};

export async function loadCampaigns(env: AdminEnv): Promise<Campaign[]> {
  const clientId = env.SHOPIFY_ADMIN_CLIENT_ID || env.WRITE_INVENTORY_CLIENT_ID;
  const secret = env.SHOPIFY_ADMIN_CLIENT_SECRET || env.WRITE_INVENTORY_SECRET;
  const shop = env.PUBLIC_STORE_DOMAIN;
  if (!clientId || !secret || !shop) return [];

  if (memo && Date.now() - memo.at < TTL_MS) return memo.value;

  try {
    const value = await fetchCampaigns({shop, clientId, secret});
    memo = {at: Date.now(), value};
    return value;
  } catch (error) {
    console.error('[campaigns] could not load automatic discounts:', error);
    // keep showing the last good data rather than flickering the banner off
    return memo?.value ?? [];
  }
}

async function getToken({shop, clientId, secret}: {shop: string; clientId: string; secret: string}) {
  if (tokenMemo && tokenMemo.expiresAt > Date.now() + 60_000) return tokenMemo.token;
  const res = await fetch(`https://${shop}/admin/oauth/access_token`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({client_id: clientId, client_secret: secret, grant_type: 'client_credentials'}),
  });
  const json = (await res.json()) as {access_token?: string; expires_in?: number; error?: string};
  if (!json.access_token) throw new Error(`token: ${json.error ?? res.status}`);
  tokenMemo = {
    token: json.access_token,
    expiresAt: Date.now() + (json.expires_in ?? 86_400) * 1000,
  };
  return tokenMemo.token;
}

async function adminQuery<T>(
  creds: {shop: string; clientId: string; secret: string},
  query: string,
  variables?: Record<string, unknown>,
): Promise<T> {
  const token = await getToken(creds);
  const res = await fetch(`https://${creds.shop}/admin/api/${API_VERSION}/graphql.json`, {
    method: 'POST',
    headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': token},
    body: JSON.stringify({query, variables}),
  });
  const json = (await res.json()) as {data?: T; errors?: unknown};
  if (json.errors || !json.data) throw new Error(JSON.stringify(json.errors ?? res.status));
  return json.data;
}

// ---- Admin API shapes (only the fields used) --------------------------------

type ProductRef = {id: string; title: string; handle: string; productType: string};
type Items =
  | {__typename: 'DiscountProducts'; products: {nodes: ProductRef[]}}
  | {__typename: 'DiscountCollections'; collections: {nodes: {id: string}[]}}
  | {__typename: 'AllDiscountItems'; allItems: boolean};
type Effect =
  | {__typename: 'DiscountPercentage'; percentage: number}
  | {__typename: 'DiscountAmount'; amount: {amount: string}};
type GetsValue =
  | {__typename: 'DiscountOnQuantity'; quantity: {quantity: string}; effect: Effect}
  | Effect;
type Minimum =
  | {__typename: 'DiscountMinimumSubtotal'; greaterThanOrEqualToSubtotal: {amount: string}}
  | {__typename: 'DiscountMinimumQuantity'; greaterThanOrEqualToQuantity: string}
  | null;
type Discount = {
  __typename: 'DiscountAutomaticBxgy' | 'DiscountAutomaticBasic' | 'DiscountAutomaticFreeShipping' | string;
  title: string;
  status: string;
  startsAt: string;
  endsAt: string | null;
  usesPerOrderLimit?: number | null;
  minimumRequirement?: Minimum;
  customerBuys?: {value: {__typename: string; quantity?: string; amount?: string}; items: Items};
  customerGets?: {value: GetsValue; items: Items};
};

// Admin API documents: deliberately not tagged, so Hydrogen's Storefront codegen skips them
const DISCOUNTS_QUERY = `
  query StorefrontCampaigns {
    automaticDiscountNodes(first: 20, query: "status:active") {
      nodes {
        id
        automaticDiscount {
          __typename
          ... on DiscountAutomaticBxgy {
            title status startsAt endsAt usesPerOrderLimit
            customerBuys {
              value { __typename ... on DiscountQuantity { quantity } ... on DiscountPurchaseAmount { amount } }
              items { ...ItemsFields }
            }
            customerGets {
              value {
                __typename
                ... on DiscountOnQuantity {
                  quantity { quantity }
                  effect { __typename ... on DiscountPercentage { percentage } ... on DiscountAmount { amount { amount } } }
                }
                ... on DiscountPercentage { percentage }
                ... on DiscountAmount { amount { amount } }
              }
              items { ...ItemsFields }
            }
          }
          ... on DiscountAutomaticBasic {
            title status startsAt endsAt
            minimumRequirement {
              __typename
              ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount } }
              ... on DiscountMinimumQuantity { greaterThanOrEqualToQuantity }
            }
            customerGets {
              value {
                __typename
                ... on DiscountPercentage { percentage }
                ... on DiscountAmount { amount { amount } }
                ... on DiscountOnQuantity {
                  quantity { quantity }
                  effect { __typename ... on DiscountPercentage { percentage } ... on DiscountAmount { amount { amount } } }
                }
              }
              items { ...ItemsFields }
            }
          }
          ... on DiscountAutomaticFreeShipping {
            title status startsAt endsAt
            minimumRequirement {
              __typename
              ... on DiscountMinimumSubtotal { greaterThanOrEqualToSubtotal { amount } }
            }
          }
        }
      }
    }
  }
  fragment ItemsFields on DiscountItems {
    __typename
    ... on DiscountProducts { products(first: 50) { nodes { id title handle productType } } }
    ... on DiscountCollections { collections(first: 10) { nodes { id } } }
    ... on AllDiscountItems { allItems }
  }
`;

const COLLECTION_PRODUCTS_QUERY = `
  query CampaignCollectionProducts($id: ID!) {
    collection(id: $id) { products(first: 250) { nodes { id title handle productType } } }
  }
`;

async function fetchCampaigns(creds: {shop: string; clientId: string; secret: string}): Promise<Campaign[]> {
  const data = await adminQuery<{automaticDiscountNodes: {nodes: {id: string; automaticDiscount: Discount}[]}}>(
    creds,
    DISCOUNTS_QUERY,
  );
  const now = Date.now();
  const campaigns: Campaign[] = [];

  for (const node of data.automaticDiscountNodes.nodes) {
    const d = node.automaticDiscount;
    if (d.status !== 'ACTIVE') continue;
    if (d.startsAt && Date.parse(d.startsAt) > now) continue;
    if (d.endsAt && Date.parse(d.endsAt) < now) continue;

    const kind: CampaignKind | null =
      d.__typename === 'DiscountAutomaticBxgy' ? 'bxgy'
      : d.__typename === 'DiscountAutomaticBasic' ? 'basic'
      : d.__typename === 'DiscountAutomaticFreeShipping' ? 'shipping'
      : null;
    if (!kind) continue;

    // eligible products: what the customer *gets* the discount on
    const items = d.customerGets?.items;
    let products: ProductRef[] = [];
    let appliesToAll = false;
    if (items?.__typename === 'DiscountProducts') {
      products = items.products.nodes;
    } else if (items?.__typename === 'DiscountCollections') {
      for (const c of items.collections.nodes) {
        const r = await adminQuery<{collection: {products: {nodes: ProductRef[]}} | null}>(
          creds,
          COLLECTION_PRODUCTS_QUERY,
          {id: c.id},
        );
        products.push(...(r.collection?.products.nodes ?? []));
      }
    } else if (items?.__typename === 'AllDiscountItems') {
      appliesToAll = true;
    }
    const unique = new Map(products.map((p) => [p.id, p]));
    products = [...unique.values()];

    // value: percentage / amount, possibly nested under "on quantity"
    const value = d.customerGets?.value;
    const effect: Effect | undefined =
      value && value.__typename === 'DiscountOnQuantity' ? value.effect : (value as Effect | undefined);
    const percentage =
      effect?.__typename === 'DiscountPercentage' ? Math.round(effect.percentage * 100) : null;
    const amount =
      effect?.__typename === 'DiscountAmount' ? parseFloat(effect.amount.amount) : null;
    const getsQuantity =
      value && value.__typename === 'DiscountOnQuantity' ? Number(value.quantity.quantity) : 1;
    const buysQuantity =
      d.customerBuys?.value?.__typename === 'DiscountQuantity'
        ? Number(d.customerBuys.value.quantity)
        : 1;
    const minimumSubtotal =
      d.minimumRequirement?.__typename === 'DiscountMinimumSubtotal'
        ? parseFloat(d.minimumRequirement.greaterThanOrEqualToSubtotal.amount)
        : null;
    const types = new Set(products.map((p) => p.productType).filter(Boolean));

    const base: Omit<Campaign, 'copy'> = {
      id: node.id,
      kind,
      title: d.title,
      endsAt: d.endsAt,
      percentage,
      amount,
      buysQuantity,
      getsQuantity,
      usesPerOrderLimit: d.usesPerOrderLimit ?? null,
      appliesToAll,
      productIds: products.map((p) => p.id),
      productHandles: products.map((p) => p.handle),
      productTitles: products.map((p) => p.title),
      productType: types.size === 1 ? [...types][0] : null,
      minimumSubtotal,
    };
    campaigns.push({...base, copy: buildCopy(base)});
  }

  // product promotions before shipping perks; the first one drives the banner
  const rank: Record<CampaignKind, number> = {bxgy: 0, basic: 1, shipping: 2};
  return campaigns.sort((a, b) => rank[a.kind] - rank[b.kind]);
}
