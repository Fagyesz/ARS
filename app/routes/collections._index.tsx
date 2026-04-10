import {useLoaderData, Link} from 'react-router';
import type {Route} from './+types/collections._index';
import {getPaginationVariables, Image} from '@shopify/hydrogen';
import type {CollectionFragment} from 'storefrontapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

export const meta: Route.MetaFunction = () => {
  return [
    {title: 'Kollekciók | Ars Mosoris'},
    {name: 'description', content: 'Böngéssz az Ars Mosoris kollekciói között — egyedi ruházat és kiegészítők képzőművészeti alkotásokkal.'},
  ];
};

export async function loader(args: Route.LoaderArgs) {
  const deferredData = loadDeferredData(args);
  const criticalData = await loadCriticalData(args);
  return {...deferredData, ...criticalData};
}

async function loadCriticalData({context, request}: Route.LoaderArgs) {
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 12,
  });

  const [{collections}] = await Promise.all([
    context.storefront.query(COLLECTIONS_QUERY, {
      variables: paginationVariables,
    }),
  ]);

  return {collections};
}

function loadDeferredData({context}: Route.LoaderArgs) {
  return {};
}

export default function Collections() {
  const {collections} = useLoaderData<typeof loader>();

  return (
    <div className="collections-editorial">
      <section className="collections-hero">
        <div className="collections-hero-bg-logo" aria-hidden="true" />
        <div className="container">
          <div className="collections-hero-inner">
            <div className="collections-hero-meta">
              <span className="collections-hero-eyebrow">Ars Mosoris</span>
              <span className="collections-hero-meta-sep" />
              <span className="collections-hero-count">Kollekciók</span>
            </div>
            <h1 className="collections-hero-title">Válo&shy;gatott<br />Sorozataink</h1>
            <div className="collections-hero-rule" />
            <p className="collections-hero-lead">
              Minden kollekcióban egy alkotói világ — képzőművészeti technikákkal készült, egyedi ruhadarabok.
            </p>
          </div>
        </div>
      </section>
      <div className="collections-grid-section">
        <div className="container">
          <PaginatedResourceSection<CollectionFragment>
            connection={collections}
            resourcesClassName="collections-frame-grid"
          >
            {({node: collection, index}) => (
              <div key={collection.id}>
                <Link
                  to={`/collections/${collection.handle}`}
                  className={`collections-index-card${index === 0 ? ' collections-index-card--featured' : ''}`}
                  prefetch="intent"
                  style={{animationDelay: `${index * 0.09}s`}}
                >
                  <div className="collections-index-img">
                    {collection.image ? (
                      <Image
                        alt={collection.image.altText || collection.title}
                        aspectRatio={index === 0 ? '16/9' : '4/3'}
                        data={collection.image}
                        loading={index < 4 ? 'eager' : undefined}
                        sizes={
                          index === 0
                            ? '100vw'
                            : '(min-width: 1024px) 33vw, (min-width: 640px) 50vw, 100vw'
                        }
                      />
                    ) : (
                      <div className="collections-index-placeholder" />
                    )}
                  </div>
                  <div className="collections-index-info">
                    <h2 className="collections-index-title">{collection.title}</h2>
                    <span className="collections-index-cta">Megnézem</span>
                  </div>
                </Link>
              </div>
            )}
          </PaginatedResourceSection>
        </div>
      </div>
    </div>
  );
}

const COLLECTIONS_QUERY = `#graphql
  fragment Collection on Collection {
    id
    title
    handle
    image {
      id
      url
      altText
      width
      height
    }
  }
  query StoreCollections(
    $country: CountryCode
    $endCursor: String
    $first: Int
    $language: LanguageCode
    $last: Int
    $startCursor: String
  ) @inContext(country: $country, language: $language) {
    collections(
      first: $first,
      last: $last,
      before: $startCursor,
      after: $endCursor
    ) {
      nodes {
        ...Collection
      }
      pageInfo {
        hasNextPage
        hasPreviousPage
        startCursor
        endCursor
      }
    }
  }
` as const;
