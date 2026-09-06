// Seeds the shop-managed content the storefront reads (app/lib/content.ts):
//   - metaobject definitions shop_settings / size_guide / artist (+ product metafield custom.size_guide)
//   - one shop_settings entry, three size guides, four artists (portraits uploaded to Files)
//   - navigation menus hydrogen-main and hydrogen-footer
// Run from the repo root: node scripts/seed-content.cjs [--apply]
// Needs custom-app scopes: write_metaobject_definitions, write_metaobjects,
// write_online_store_navigation, write_files (+ the existing write_products).
//   node scripts/seed-content.cjs          dry run (checks scopes, prints the plan)
//   node scripts/seed-content.cjs --apply  create/update everything
const fs = require('fs');
const APPLY = process.argv.includes('--apply');
const shop = 'ars-mosoris-3.myshopify.com';
const API = `https://${shop}/admin/api/2025-07/graphql.json`;
const SITE = 'https://arsmosoris.art';

const env = Object.fromEntries(
  fs.readFileSync(require('path').join(__dirname, '..', '.env'), 'utf8').split(/\r?\n/).filter((l) => l.includes('=') && !l.startsWith('#'))
    .map((l) => { const i = l.indexOf('='); return [l.slice(0, i).trim(), l.slice(i + 1).trim().replace(/^"|"$/g, '')]; }),
);

async function token() {
  // client-credentials tokens carry the app's *current* scopes, so always mint a fresh one here
  const r = await fetch(`https://${shop}/admin/oauth/access_token`, {method: 'POST', headers: {'Content-Type': 'application/json'},
    body: JSON.stringify({client_id: env.WRITE_INVENTORY_CLIENT_ID, client_secret: env.WRITE_INVENTORY_SECRET, grant_type: 'client_credentials'})});
  const j = await r.json();
  if (!j.access_token) throw new Error('token: ' + JSON.stringify(j));
  
  return j.access_token;
}
let TOKEN;
async function gql(query, variables) {
  const res = await fetch(API, {method: 'POST', headers: {'Content-Type': 'application/json', 'X-Shopify-Access-Token': TOKEN}, body: JSON.stringify({query, variables})});
  const j = await res.json();
  if (j.errors) throw new Error(JSON.stringify(j.errors.map((e) => e.message)));
  return j.data;
}
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ---- content -----------------------------------------------------------------
const SETTINGS = {
  tagline: 'Négy képzőművész által alapított márka, ahol a mindennapi viselet és a kortárs művészet találkozik.',
  contact_email: 'arsmosoris@gmail.com',
  instagram: 'https://www.instagram.com/ars.mosoris/',
  facebook: 'https://www.facebook.com/profile.php?id=61574998793960',
  tiktok: 'https://www.tiktok.com/@ars.mosoris',
  youtube: 'https://www.youtube.com/@ars.mosoris',
  shipping_carrier: 'GLS',
  parcel_point_price: '1290',
  home_delivery_price: '1590',
  free_shipping_threshold: '30000',
  handling_time: '1–2 munkanap',
  transit_time: '2–3 munkanap',
  return_days: '14',
  payment_methods: 'Biztonságos online fizetés',
  usp_title: 'Kézzel készül Budapesten',
  usp_text: 'kis szériás, egyedi grafika',
  company_name: '',
  company_address: 'Budapest, Magyarország',
  tax_number: '',
};

const SIZE_GUIDES = [
  {handle: 'polo', title: 'Mérettáblázat', product_type: 'Póló', columns: 'Méret, Mellbőség, Hossz',
   rows: 'S, 96 cm, 68 cm\nM, 102 cm, 71 cm\nL, 108 cm, 74 cm\nXL, 114 cm, 76 cm\nXXL, 120 cm, 78 cm',
   note: 'Unisex szabás; a mellbőség a hónaljnál mért teljes körméret. Ha két méret között vagy, a nagyobbat javasoljuk.'},
  {handle: 'pulover', title: 'Méretek és szabás', product_type: 'Kapucnis pulóver, Környakú pulóver', columns: '', rows: '',
   note: 'Unisex, bő szabású pulóver, elérhető méretek: {sizes}. Ha bizonytalan vagy, írj nekünk, és lemérjük neked a konkrét darabot.'},
  {handle: 'egyedi', title: 'Méretek és szabás', product_type: 'Kabát, Blézer, Ing, Blúz, Szoknya, Nadrág, Short', columns: '', rows: '',
   note: 'Egyetlen példányban készült darab, mérete: {sizes}. Pontos méreteket szívesen küldünk: írj nekünk a termék nevével.'},
];

const ARTISTS = [
  {handle: 'dori', sort: 1, name: 'Dóri', full_name: 'Kéringer Dóri', role: 'Képzőművész', vendor: 'Dóri', instagram: 'https://instagram.com/keringerart',
   bio: 'Dóri főleg linómetszettel dolgozik, visszatérő motívumai a bogarak. Az Ars Mosorisnál a social media és az adminisztratív háttérfeladatok tartoznak hozzá — röviden ő a bogaras lány.',
   statement: 'Dóri vagyok, főleg linómetszettel dolgozom, visszatérő motívumaim pedig a bogarak. Az Ars Mosorisban a social media és az adminisztratív háttérfeladatok tartoznak hozzám, röviden én vagyok a bogaras lány.'},
  {handle: 'emi', sort: 2, name: 'Emi', full_name: 'Nagy Emese', role: 'Képzőművész', vendor: 'Emi', instagram: 'https://instagram.com/emeseszarakszik',
   bio: 'Emi sokféle anyaggal kísérletezik, és egy újrahasznosított, természetes irányba mozog. A Mosorisban egyfajta mindenes: felel a social mediáért, az anyagbeszerzésért és még jó sok mindenért.',
   statement: 'Emi vagyok, sokféle anyaggal kísérletezem, próbálok egy újrahasznosított, természetes irányba mozgolódni. A Mosorisban egyfajta mindenes vagyok, felelek a socialért, az anyagbeszerzésért, meg jó sok mindenért.'},
  {handle: 'zorka', sort: 3, name: 'Zorka', full_name: 'Nagy Zorka Hanna', role: 'Képzőművész', vendor: 'Zorka', instagram: 'https://instagram.com/zorka_n_',
   bio: 'Zorka főként linóleummal dolgozik. Szereti az aprólékos motívumokat, és figurálisan ábrázol. Az Ars Mosorisnál a kommunikációért, valamint a szervezésért és a kivitelezésért felelős.',
   statement: 'Zorka vagyok, főként linóleummal dolgozok. Szeretem az aprólékos motívumokat, figurálisan ábrázolok. Az Ars Mosorisban a kommunikációért és a szervezésért, kivitelezésért vagyok felelős.'},
  {handle: 'zsolt', sort: 4, name: 'Zsolt', full_name: 'Nagy Zsolt', role: 'Képzőművész', vendor: 'Zsolt', instagram: 'https://instagram.com/unwise_dose_of_coffee',
   bio: 'Zsolt a tervezőgrafikai és a magyar–angol fordítási feladatok egy részét végzi az Ars Mosorisnál. Általában tintával dolgozik, grunge-os, sokszor groteszk stílusban, és új életet lehel a használt ruhákba.',
   statement: 'Zsolt vagyok, az Ars Mosorisnál a tervezőgrafikai és a magyar–angol fordítási feladatok egy részét végzem. Általában tintával dolgozok, egy grunge-os, sokszor groteszk stílusban. Szeretnék új életet lehelni használt ruhákba, illetve megtanulni varrógépet kezelni, és idővel vegyíteni a rajzolt és varrott vonalat a munkáimon.'},
];

const T = (key, name, type, extra = {}) => ({key, name, type, ...extra});
const DEFINITIONS = [
  {type: 'shop_settings', name: 'Webshop beállítások', displayNameField: 'shipping_carrier', fieldDefinitions: [
    T('tagline', 'Rövid bemutatkozás (lábléc)', 'multi_line_text_field'),
    T('contact_email', 'Kapcsolati e-mail', 'single_line_text_field'),
    T('instagram', 'Instagram', 'url'), T('facebook', 'Facebook', 'url'), T('tiktok', 'TikTok', 'url'), T('youtube', 'YouTube', 'url'),
    T('shipping_carrier', 'Futárszolgálat', 'single_line_text_field'),
    T('parcel_point_price', 'Csomagpont ára (Ft)', 'number_integer'),
    T('home_delivery_price', 'Házhoz szállítás ára (Ft)', 'number_integer'),
    T('free_shipping_threshold', 'Ingyenes szállítás ettől (Ft)', 'number_integer'),
    T('handling_time', 'Feladási idő', 'single_line_text_field'),
    T('transit_time', 'Kézbesítési idő', 'single_line_text_field'),
    T('return_days', 'Elállási határidő (nap)', 'number_integer'),
    T('payment_methods', 'Fizetési módok (szöveg)', 'single_line_text_field'),
    T('usp_title', 'Érv a termékoldalon (cím)', 'single_line_text_field'),
    T('usp_text', 'Érv a termékoldalon (szöveg)', 'single_line_text_field'),
    T('company_name', 'Cégnév', 'single_line_text_field'),
    T('company_address', 'Székhely / cím', 'single_line_text_field'),
    T('tax_number', 'Adószám', 'single_line_text_field'),
  ]},
  {type: 'size_guide', name: 'Mérettáblázat', displayNameField: 'title', fieldDefinitions: [
    T('title', 'Cím', 'single_line_text_field', {required: true}),
    T('product_type', 'Terméktípus(ok), vesszővel', 'single_line_text_field'),
    T('columns', 'Oszlopok, vesszővel', 'single_line_text_field'),
    T('rows', 'Sorok (soronként: méret, mellbőség, hossz)', 'multi_line_text_field'),
    T('note', 'Megjegyzés ({sizes} = a termék méretei)', 'multi_line_text_field'),
  ]},
  {type: 'artist', name: 'Alkotó', displayNameField: 'name', fieldDefinitions: [
    T('name', 'Név', 'single_line_text_field', {required: true}),
    T('full_name', 'Teljes név', 'single_line_text_field'),
    T('role', 'Szerep', 'single_line_text_field'),
    T('bio', 'Bemutatkozás', 'multi_line_text_field'),
    T('statement', 'Művészi hitvallás', 'multi_line_text_field'),
    T('instagram', 'Instagram', 'url'),
    T('vendor', 'Gyártó neve a termékeken (vendor)', 'single_line_text_field'),
    T('slug', 'URL (pl. dori)', 'single_line_text_field'),
    T('sort', 'Sorrend', 'number_integer'),
    T('portrait', 'Portré', 'file_reference', {validations: [{name: 'file_type_options', value: '["Image"]'}]}),
  ]},
];

const MENU_MAIN = [
  {title: 'Bolt', url: '/collections/all'}, {title: 'Kollekciók', url: '/collections'}, {title: 'Alkotók', url: '/artists'},
  {title: 'Események', url: '/events'}, {title: 'Rólunk', url: '/about'}, {title: 'Kapcsolat', url: '/contact'},
];
const MENU_FOOTER = [
  {title: 'Bolt', url: '/collections/all', items: [
    {title: 'Minden termék', url: '/collections/all'}, {title: 'Pólók', url: '/collections/polok'}, {title: 'Pulóverek', url: '/collections/puloverek'},
    {title: 'Kabátok és blézerek', url: '/collections/kabatok'}, {title: 'Nadrágok és szoknyák', url: '/collections/nadragok-es-szoknyak'},
    {title: 'Egyedi darabok', url: '/collections/egyedi-darabok'}, {title: 'Akciók', url: '/akcio'}, {title: 'Kívánságlista', url: '/wishlist'}]},
  {title: 'Alkotók', url: '/artists', items: [{title: 'Alkotóink', url: '/artists'}, {title: 'Események', url: '/events'}, {title: 'Rólunk', url: '/about'}]},
  {title: 'Információ', url: '/contact', items: [
    {title: 'Kapcsolat', url: '/contact'}, {title: 'Szállítás', url: '/policies/shipping-policy'}, {title: 'Visszaküldés', url: '/policies/refund-policy'},
    {title: 'Adatvédelem', url: '/policies/privacy-policy'}, {title: 'ÁSZF', url: '/policies/terms-of-service'}]},
];

// ---- helpers -----------------------------------------------------------------
async function ensureDefinition(def) {
  const existing = (await gql('query($type: String!) { metaobjectDefinitionByType(type: $type) { id fieldDefinitions { key } } }', {type: def.type})).metaobjectDefinitionByType;
  const access = {admin: 'MERCHANT_READ_WRITE', storefront: 'PUBLIC_READ'};
  if (!existing) {
    const r = await gql('mutation($d: MetaobjectDefinitionCreateInput!) { metaobjectDefinitionCreate(definition: $d) { metaobjectDefinition { id } userErrors { field message } } }',
      {d: {type: def.type, name: def.name, displayNameField: def.displayNameField, access, fieldDefinitions: def.fieldDefinitions}});
    if (r.metaobjectDefinitionCreate.userErrors.length) throw new Error(def.type + ': ' + JSON.stringify(r.metaobjectDefinitionCreate.userErrors));
    console.log(`  definition ${def.type} created`);
    return r.metaobjectDefinitionCreate.metaobjectDefinition.id;
  }
  const have = new Set(existing.fieldDefinitions.map((f) => f.key));
  const missing = def.fieldDefinitions.filter((f) => !have.has(f.key));
  const r = await gql('mutation($id: ID!, $d: MetaobjectDefinitionUpdateInput!) { metaobjectDefinitionUpdate(id: $id, definition: $d) { userErrors { field message } } }',
    {id: existing.id, d: {access, fieldDefinitions: missing.map((f) => ({create: f}))}});
  if (r.metaobjectDefinitionUpdate.userErrors.length) throw new Error(def.type + ': ' + JSON.stringify(r.metaobjectDefinitionUpdate.userErrors));
  console.log(`  definition ${def.type} exists${missing.length ? `, added ${missing.map((f) => f.key).join(', ')}` : ''}`);
  return existing.id;
}

async function upsert(type, handle, fields) {
  const r = await gql('mutation($handle: MetaobjectHandleInput!, $m: MetaobjectUpsertInput!) { metaobjectUpsert(handle: $handle, metaobject: $m) { metaobject { id } userErrors { field message } } }',
    {handle: {type, handle}, m: {fields: Object.entries(fields).filter(([, v]) => v !== undefined && v !== null && v !== '').map(([key, value]) => ({key, value: String(value)}))}});
  if (r.metaobjectUpsert.userErrors.length) throw new Error(`${type}/${handle}: ` + JSON.stringify(r.metaobjectUpsert.userErrors));
  console.log(`  ${type}/${handle} saved`);
  return r.metaobjectUpsert.metaobject.id;
}

async function uploadPortrait(handle) {
  const existing = (await gql('query($q: String!) { files(first: 1, query: $q) { nodes { id fileStatus } } }', {q: `filename:artist-${handle}`})).files.nodes[0];
  if (existing) return existing.id;
  const r = await gql('mutation($files: [FileCreateInput!]!) { fileCreate(files: $files) { files { id fileStatus } userErrors { field message } } }',
    {files: [{originalSource: `${SITE}/artists/${handle}.jpg`, filename: `artist-${handle}.jpg`, contentType: 'IMAGE', alt: handle}]});
  if (r.fileCreate.userErrors.length) throw new Error('file: ' + JSON.stringify(r.fileCreate.userErrors));
  const id = r.fileCreate.files[0].id;
  for (let i = 0; i < 20; i++) {
    await sleep(2000);
    const s = (await gql('query($id: ID!) { node(id: $id) { ... on MediaImage { fileStatus } } }', {id})).node?.fileStatus;
    if (s === 'READY') break;
    if (s === 'FAILED') throw new Error('portrait upload failed for ' + handle);
  }
  return id;
}

async function ensureMenu(handle, title, items) {
  const existing = (await gql('query($handle: String!) { menu(handle: $handle) { id } }', {handle})).menu;
  const toInput = (i) => ({title: i.title, type: 'HTTP', url: i.url, items: (i.items ?? []).map(toInput)});
  if (existing) {
    const r = await gql('mutation($id: ID!, $title: String!, $handle: String!, $items: [MenuItemUpdateInput!]!) { menuUpdate(id: $id, title: $title, handle: $handle, items: $items) { userErrors { field message } } }',
      {id: existing.id, title, handle, items: items.map(toInput)});
    if (r.menuUpdate.userErrors.length) throw new Error(`menu ${handle}: ` + JSON.stringify(r.menuUpdate.userErrors));
    console.log(`  menu ${handle} updated`);
  } else {
    const r = await gql('mutation($title: String!, $handle: String!, $items: [MenuItemCreateInput!]!) { menuCreate(title: $title, handle: $handle, items: $items) { userErrors { field message } } }',
      {title, handle, items: items.map(toInput)});
    if (r.menuCreate.userErrors.length) throw new Error(`menu ${handle}: ` + JSON.stringify(r.menuCreate.userErrors));
    console.log(`  menu ${handle} created`);
  }
}

(async () => {
  TOKEN = await token();
  const scopes = (await gql('{ currentAppInstallation { accessScopes { handle } } }')).currentAppInstallation.accessScopes.map((s) => s.handle);
  const need = ['write_metaobject_definitions', 'write_metaobjects', 'write_online_store_navigation', 'write_files'];
  const missing = need.filter((s) => !scopes.includes(s));
  console.log(APPLY ? 'APPLY' : 'DRY RUN', '| scopes missing:', missing.length ? missing.join(', ') : 'none');
  console.log(`plan: ${DEFINITIONS.length} definitions + custom.size_guide metafield, 1 settings entry, ${SIZE_GUIDES.length} size guides, ${ARTISTS.length} artists (+portraits), 2 menus`);
  if (!APPLY) return;
  if (missing.length) throw new Error('add the missing scopes to the custom app first: ' + missing.join(', '));

  console.log('\ndefinitions');
  const ids = {};
  for (const def of DEFINITIONS) ids[def.type] = await ensureDefinition(def);

  // product metafield "Mérettáblázat" → size_guide metaobject
  const mf = (await gql('{ metafieldDefinitions(first: 1, ownerType: PRODUCT, namespace: "custom", key: "size_guide") { nodes { id } } }')).metafieldDefinitions.nodes[0];
  if (!mf) {
    const r = await gql('mutation($d: MetafieldDefinitionInput!) { metafieldDefinitionCreate(definition: $d) { userErrors { field message } } }',
      {d: {name: 'Mérettáblázat', namespace: 'custom', key: 'size_guide', ownerType: 'PRODUCT', type: 'metaobject_reference',
           validations: [{name: 'metaobject_definition_id', value: ids.size_guide}], access: {storefront: 'PUBLIC_READ'}}});
    if (r.metafieldDefinitionCreate.userErrors.length) throw new Error('metafield def: ' + JSON.stringify(r.metafieldDefinitionCreate.userErrors));
    console.log('  product metafield custom.size_guide created');
  } else console.log('  product metafield custom.size_guide exists');

  console.log('\nentries');
  await upsert('shop_settings', 'default', SETTINGS);
  for (const g of SIZE_GUIDES) { const {handle, ...fields} = g; await upsert('size_guide', handle, fields); }
  for (const a of ARTISTS) {
    const {handle, ...fields} = a;
    const portrait = await uploadPortrait(handle);
    await upsert('artist', handle, {...fields, slug: handle, portrait});
  }

  console.log('\nmenus');
  await ensureMenu('hydrogen-main', 'Hydrogen fő menü', MENU_MAIN);
  await ensureMenu('hydrogen-footer', 'Hydrogen lábléc', MENU_FOOTER);
  console.log('\ndone');
})().catch((e) => { console.error('ERR', e.message); process.exit(1); });
