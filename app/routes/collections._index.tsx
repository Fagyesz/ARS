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
        <div className="container">
          <span className="collections-hero-eyebrow">Ars Mosoris</span>
          <h1 className="collections-hero-title">Kollekciók</h1>
          <p className="collections-hero-lead">
            Minden kollekcióban egy-egy alkotói világ — válogatott sorozataink képzőművészeti technikákkal készült ruhadarabokból.
          </p>
        </div>
      </section>
      <div className="container">
        <PaginatedResourceSection<CollectionFragment>
          connection={collections}
          resourcesClassName="collections-editorial-grid"
        >
          {({node: collection, index}) => (
            <div key={collection.id}>
              <Link
                to={`/collections/${collection.handle}`}
                className="collection-drop-card"
                prefetch="intent"
              >
                <div className="collection-drop-image">
                  {collection.image ? (
                    <Image
                      alt={collection.image.altText || collection.title}
                      aspectRatio="16/9"
                      data={collection.image}
                      loading={index < 4 ? 'eager' : undefined}
                      sizes="(min-width: 1024px) 50vw, 100vw"
                    />
                  ) : (
                    <div className="collection-drop-placeholder" />
                  )}
                </div>
                <div className="collection-drop-overlay">
                  <h2 className="collection-drop-title">{collection.title}</h2>
                  <span className="collection-drop-cta">Megnézem →</span>
                </div>
              </Link>
            </div>
          )}
        </PaginatedResourceSection>
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
