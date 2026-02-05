import {
  Link,
  useLoaderData,
  useNavigation,
  useSearchParams,
} from 'react-router';
import type {Route} from './+types/account.orders._index';
import {useRef} from 'react';
import {
  Money,
  getPaginationVariables,
  flattenConnection,
} from '@shopify/hydrogen';
import {
  buildOrderSearchQuery,
  parseOrderFilters,
  ORDER_FILTER_FIELDS,
  type OrderFilterParams,
} from '~/lib/orderFilters';
import {CUSTOMER_ORDERS_QUERY} from '~/graphql/customer-account/CustomerOrdersQuery';
import type {
  CustomerOrdersFragment,
  OrderItemFragment,
} from 'customer-accountapi.generated';
import {PaginatedResourceSection} from '~/components/PaginatedResourceSection';

type OrdersLoaderData = {
  customer: CustomerOrdersFragment;
  filters: OrderFilterParams;
};

export const meta: Route.MetaFunction = () => {
  return [{title: 'Rendelések | Ars Mosoris'}];
};

export async function loader({request, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  const paginationVariables = getPaginationVariables(request, {
    pageBy: 20,
  });

  const url = new URL(request.url);
  const filters = parseOrderFilters(url.searchParams);
  const query = buildOrderSearchQuery(filters);

  const {data, errors} = await customerAccount.query(CUSTOMER_ORDERS_QUERY, {
    variables: {
      ...paginationVariables,
      query,
      language: customerAccount.i18n.language,
    },
  });

  if (errors?.length || !data?.customer) {
    throw Error('Customer orders not found');
  }

  return {customer: data.customer, filters};
}

const STATUS_LABELS: Record<string, string> = {
  PAID: 'Fizetve',
  PENDING: 'Függőben',
  REFUNDED: 'Visszatérítve',
  PARTIALLY_REFUNDED: 'Részben visszatérítve',
  FULFILLED: 'Teljesítve',
  UNFULFILLED: 'Feldolgozás alatt',
  PARTIALLY_FULFILLED: 'Részben teljesítve',
};

export default function Orders() {
  const {customer, filters} = useLoaderData<OrdersLoaderData>();
  const {orders} = customer;

  return (
    <div className="account-orders">
      <OrderSearchForm currentFilters={filters} />
      <OrdersTable orders={orders} filters={filters} />
    </div>
  );
}

function OrdersTable({
  orders,
  filters,
}: {
  orders: CustomerOrdersFragment['orders'];
  filters: OrderFilterParams;
}) {
  const hasFilters = !!(filters.name || filters.confirmationNumber);

  return (
    <div className="orders-list" aria-live="polite">
      {orders?.nodes.length ? (
        <PaginatedResourceSection connection={orders}>
          {({node: order}) => <OrderItem key={order.id} order={order} />}
        </PaginatedResourceSection>
      ) : (
        <EmptyOrders hasFilters={hasFilters} />
      )}
    </div>
  );
}

function EmptyOrders({hasFilters = false}: {hasFilters?: boolean}) {
  return (
    <div className="orders-empty">
      {hasFilters ? (
        <>
          <p>Nem találtunk a keresésnek megfelelő rendelést.</p>
          <Link to="/account/orders" className="btn btn-outline">
            Szűrők törlése
          </Link>
        </>
      ) : (
        <>
          <p>Még nincs rendelésed.</p>
          <Link to="/collections/all" className="btn btn-primary">
            Kezdj el vásárolni
          </Link>
        </>
      )}
    </div>
  );
}

function OrderSearchForm({
  currentFilters,
}: {
  currentFilters: OrderFilterParams;
}) {
  const [searchParams, setSearchParams] = useSearchParams();
  const navigation = useNavigation();
  const isSearching =
    navigation.state !== 'idle' &&
    navigation.location?.pathname?.includes('orders');
  const formRef = useRef<HTMLFormElement>(null);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const params = new URLSearchParams();

    const name = formData.get(ORDER_FILTER_FIELDS.NAME)?.toString().trim();
    const confirmationNumber = formData
      .get(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER)
      ?.toString()
      .trim();

    if (name) params.set(ORDER_FILTER_FIELDS.NAME, name);
    if (confirmationNumber)
      params.set(ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER, confirmationNumber);

    setSearchParams(params);
  };

  const hasFilters = currentFilters.name || currentFilters.confirmationNumber;

  return (
    <form
      ref={formRef}
      onSubmit={handleSubmit}
      className="order-search-form"
      aria-label="Rendelések keresése"
    >
      <fieldset className="order-search-fieldset">
        <legend className="order-search-legend">Rendelések szűrése</legend>

        <div className="order-search-inputs">
          <input
            type="search"
            name={ORDER_FILTER_FIELDS.NAME}
            placeholder="Rendelésszám"
            aria-label="Rendelésszám"
            defaultValue={currentFilters.name || ''}
            className="order-search-input"
          />
          <input
            type="search"
            name={ORDER_FILTER_FIELDS.CONFIRMATION_NUMBER}
            placeholder="Megerősítési szám"
            aria-label="Megerősítési szám"
            defaultValue={currentFilters.confirmationNumber || ''}
            className="order-search-input"
          />
        </div>

        <div className="order-search-buttons">
          <button type="submit" className="btn btn-primary" disabled={isSearching}>
            {isSearching ? 'Keresés...' : 'Keresés'}
          </button>
          {hasFilters && (
            <button
              type="button"
              className="btn btn-outline"
              disabled={isSearching}
              onClick={() => {
                setSearchParams(new URLSearchParams());
                formRef.current?.reset();
              }}
            >
              Törlés
            </button>
          )}
        </div>
      </fieldset>
    </form>
  );
}

function OrderItem({order}: {order: OrderItemFragment}) {
  const fulfillmentStatus = flattenConnection(order.fulfillments)[0]?.status;

  return (
    <div className="order-card">
      <div>
        <div className="order-card-header">
          <Link to={`/account/orders/${btoa(order.id)}`} className="order-card-number">
            #{order.number}
          </Link>
          <span className="order-card-date">
            {new Date(order.processedAt).toLocaleDateString('hu-HU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
        </div>
        <div className="order-card-statuses">
          {order.financialStatus && (
            <span className={`order-status-badge ${order.financialStatus.toLowerCase()}`}>
              {STATUS_LABELS[order.financialStatus] ?? order.financialStatus}
            </span>
          )}
          {fulfillmentStatus && (
            <span className={`order-status-badge ${fulfillmentStatus.toLowerCase()}`}>
              {STATUS_LABELS[fulfillmentStatus] ?? fulfillmentStatus}
            </span>
          )}
        </div>
      </div>
      <div className="order-card-right">
        <div className="order-card-price">
          <Money data={order.totalPrice} />
        </div>
        <Link to={`/account/orders/${btoa(order.id)}`} className="order-card-link">
          Részletek →
        </Link>
      </div>
    </div>
  );
}
