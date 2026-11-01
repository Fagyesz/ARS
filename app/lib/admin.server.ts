/**
 * Admin API access for the server: a custom-app client id/secret
 * (SHOPIFY_ADMIN_CLIENT_ID / SHOPIFY_ADMIN_CLIENT_SECRET in the Oxygen
 * environment) exchanged for a short-lived token.
 */
const API_VERSION = '2025-07';

let tokenMemo: {token: string; expiresAt: number} | null = null;

export type AdminEnv = {
  PUBLIC_STORE_DOMAIN?: string;
  SHOPIFY_ADMIN_CLIENT_ID?: string;
  SHOPIFY_ADMIN_CLIENT_SECRET?: string;
  WRITE_INVENTORY_CLIENT_ID?: string;
  WRITE_INVENTORY_SECRET?: string;
};

export type AdminCreds = {shop: string; clientId: string; secret: string};

export function adminCreds(env: AdminEnv): AdminCreds | null {
  const clientId = env.SHOPIFY_ADMIN_CLIENT_ID || env.WRITE_INVENTORY_CLIENT_ID;
  const secret = env.SHOPIFY_ADMIN_CLIENT_SECRET || env.WRITE_INVENTORY_SECRET;
  const shop = env.PUBLIC_STORE_DOMAIN;
  return clientId && secret && shop ? {shop, clientId, secret} : null;
}

async function getToken({shop, clientId, secret}: AdminCreds) {
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

export async function adminQuery<T>(
  creds: AdminCreds,
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

/**
 * The customer e-mail on an order, or null when no such order is visible. The
 * read_orders scope covers the last 60 days, so an older order also gives null.
 */
export async function findOrderEmail(creds: AdminCreds, name: string): Promise<string | null> {
  const data = await adminQuery<{orders: {nodes: {name: string; email: string | null}[]}}>(
    creds,
    `query OrderEmail($query: String!) {
      orders(first: 5, query: $query) { nodes { name email } }
    }`,
    {query: `name:${name}`},
  );
  // the search is loose, so the name is compared exactly here
  return data.orders.nodes.find((order) => order.name === name)?.email ?? null;
}
