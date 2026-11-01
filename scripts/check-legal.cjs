// Pre-launch check of the legal data kept in Shopify: operator details in the
// shop_settings metaobject, fibre composition on every active product.
// Read-only. Needs the Admin API credentials in .env. Exit 1 lists what is missing.
//   node scripts/check-legal.cjs
const fs = require('fs');
const path = require('path');

const env = Object.fromEntries(
  fs.readFileSync(path.join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);
const shop = env.PUBLIC_STORE_DOMAIN;
const API = `https://${shop}/admin/api/2025-01/graphql.json`;

// label, metaobject key, optional test of the value
const REQUIRED = [
  ['név "e.v." megjelöléssel', 'company_name', (v) => /egyéni vállalkozó|e\.\s?v\./i.test(v)],
  ['székhely irányítószámmal', 'company_address', (v) => /\b\d{4}\b/.test(v)],
  ['nyilvántartási szám', 'company_registration_number'],
  ['nyilvántartásba vevő szerv', 'company_registry'],
  ['adószám', 'tax_number'],
  ['telefonszám', 'company_phone'],
];

async function main() {
  const auth = await fetch(`https://${shop}/admin/oauth/access_token`, {method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({client_id: env.WRITE_INVENTORY_CLIENT_ID, client_secret: env.WRITE_INVENTORY_SECRET, grant_type: 'client_credentials'})}).then((r) => r.json());
  if (!auth.access_token) throw new Error('could not get an Admin API token');
  const gql = async (query, variables) => {
    const res = await fetch(API, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': auth.access_token}, body: JSON.stringify({query, variables})});
    const json = await res.json();
    if (json.errors) throw new Error(JSON.stringify(json.errors.map((e) => e.message)));
    return json.data;
  };

  const missing = [];
  const {metaobjectByHandle: settings} = await gql('{ metaobjectByHandle(handle: {type: "shop_settings", handle: "default"}) { fields { key value } } }');
  const fields = Object.fromEntries((settings?.fields ?? []).map((f) => [f.key, f.value ?? '']));
  for (const [label, key, test] of REQUIRED) {
    const value = (fields[key] ?? '').trim();
    if (!value || (test && !test(value))) missing.push(`shop_settings: ${label} (${key})`);
  }

  let after = null;
  do {
    const {products} = await gql(`query($after: String) { products(first: 100, after: $after, query: "status:active") {
      nodes { handle fibre: metafield(namespace: "custom", key: "fibre_composition") { value } }
      pageInfo { hasNextPage endCursor } } }`, {after});
    for (const p of products.nodes) if (!p.fibre?.value?.trim()) missing.push(`product ${p.handle}: anyagösszetétel (custom.fibre_composition)`);
    after = products.pageInfo.hasNextPage ? products.pageInfo.endCursor : null;
  } while (after);

  if (missing.length) {
    console.log(`Missing (${missing.length}):\n` + missing.map((m) => `  - ${m}`).join('\n'));
    process.exit(1);
  }
  console.log('Legal data complete.');
}

main().catch((error) => { console.error(error.message); process.exit(2); });
