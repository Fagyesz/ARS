import {Link, useLoaderData} from 'react-router';
import type {Route} from './+types/akcio';
import {ProductItem} from '~/components/ProductItem';
import {loadCampaigns} from '~/lib/campaigns.server';
import {type Campaign, untilHu} from '~/lib/campaigns';
import {jsonLd, productListJsonLd, seoMeta} from '~/lib/seo';
import type {CampaignProductFragment} from 'storefrontapi.generated';

export const meta: Route.MetaFunction = ({data, location}) => {
  const first = data?.campaigns[0];
  return seoMeta({
    title: first ? first.title : 'Akciók',
    description: first
      ? first.copy.banner
      : 'Az Ars Mosoris aktuális akciói: kedvezményes pólók, pulóverek és egyedi darabok magyar képzőművészektől.',
    path: location.pathname,
  });
};

/**
 * Landing page for the running automatic discounts: every campaign with its
 * generated copy and the products it applies to. Fully data-driven.
 */
export async function loader({context}: Route.LoaderArgs) {
  const campaigns = await loadCampaigns(context.env);
  const ids = [...new Set(campaigns.flatMap((c) => c.productIds))];
  const products: Record<string, CampaignProductFragment> = {};
  if (ids.length) {
    const {nodes} = await context.storefront.query(CAMPAIGN_PRODUCTS_QUERY, {
      variables: {ids},
      cache: context.storefront.CacheShort(),
    });
    for (const node of nodes) {
      if (node && node.__typename === 'Product') products[node.id] = node;
    }
  }
  return {campaigns, products};
}

export default function CampaignsPage() {
  const {campaigns, products} = useLoaderData<typeof loader>();

  return (
    <div className="catalog-page campaign-page">
      <div className="catalog-header container">
        <h1>Akciók</h1>
        <p className="catalog-header-sub">
          {campaigns.length ? 'A kedvezmény a kosárban automatikusan érvényesül' : 'Jelenleg nincs futó akció'}
        </p>
      </div>

      {campaigns.length === 0 && (
        <div className="container catalog-empty">
          <p className="catalog-empty-text">
            Iratkozz fel a hírlevélre, és elsőként szólunk, ha indul valami.
          </p>
          <Link to="/collections/all" className="btn btn-outline">
            Irány a bolt
          </Link>
        </div>
      )}

      {campaigns.map((campaign) => (
        <CampaignSection key={campaign.id} campaign={campaign} products={products} />
      ))}
    </div>
  );
}

function CampaignSection({
  campaign,
  products,
}: {
  campaign: Campaign;
  products: Record<string, CampaignProductFragment>;
}) {
  const items = campaign.productIds.map((id) => products[id]).filter(Boolean);
  const until = untilHu(campaign.endsAt);
  return (
    <section className="container campaign-section">
      {items.length > 0 && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{__html: jsonLd(productListJsonLd(items))}}
        />
      )}
      <div className="campaign-intro">
        <span className="campaign-intro-badge">{campaign.copy.shortLabel}</span>
        <h2>{campaign.title}</h2>
        <p>{campaign.copy.productNote || campaign.copy.banner}</p>
        {until && <p className="campaign-intro-until">Érvényes {until}.</p>}
      </div>
      {campaign.appliesToAll ? (
        <div className="text-center">
          <Link to="/collections/all" className="btn btn-primary">
            Minden termékre érvényes: irány a bolt
          </Link>
        </div>
      ) : items.length ? (
        <div className="products-grid">
          {items.map((product, index) => (
            <ProductItem key={product.id} product={product} loading={index < 4 ? 'eager' : undefined} />
          ))}
        </div>
      ) : (
        <p className="text-center text-muted">Az akciós termékek hamarosan itt lesznek.</p>
      )}
    </section>
  );
}

const CAMPAIGN_PRODUCTS_QUERY = `#graphql
  fragment CampaignProduct on Product {
    id
    handle
    title
    vendor
    tags
    availableForSale
    featuredImage {
      id
      url
      altText
      width
      height
    }
    priceRange {
      minVariantPrice {
        amount
        currencyCode
      }
    }
  }
  query CampaignProducts($ids: [ID!]!, $country: CountryCode, $language: LanguageCode)
    @inContext(country: $country, language: $language) {
    nodes(ids: $ids) {
      __typename
      ...CampaignProduct
    }
  }
` as const;
