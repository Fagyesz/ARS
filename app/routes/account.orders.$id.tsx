import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/account.orders.$id';
import {Money, Image} from '@shopify/hydrogen';
import type {
  OrderLineItemFullFragment,
  OrderQuery,
} from 'customer-accountapi.generated';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';

export const meta: Route.MetaFunction = ({data}) => {
  return [{title: `Rendelés ${data?.order?.name} | Ars Mosoris`}];
};

export async function loader({params, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  const orderId = atob(params.id);
  const {data, errors}: {data: OrderQuery; errors?: Array<{message: string}>} =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: {
        orderId,
        language: customerAccount.i18n.language,
      },
    });

  if (errors?.length || !data?.order) {
    throw new Error('Order not found');
  }

  const {order} = data;

  // Extract line items directly from nodes array
  const lineItems = order.lineItems.nodes;

  // Extract discount applications directly from nodes array
  const discountApplications = order.discountApplications.nodes;

  // Get fulfillment status from first fulfillment node
  const fulfillmentStatus = order.fulfillments.nodes[0]?.status ?? 'N/A';

  // Get first discount value with proper type checking
  const firstDiscount = discountApplications[0]?.value;

  // Type guard for MoneyV2 discount
  const discountValue =
    firstDiscount?.__typename === 'MoneyV2'
      ? (firstDiscount as Extract<
          typeof firstDiscount,
          {__typename: 'MoneyV2'}
        >)
      : null;

  // Type guard for percentage discount
  const discountPercentage =
    firstDiscount?.__typename === 'PricingPercentageValue'
      ? (
          firstDiscount as Extract<
            typeof firstDiscount,
            {__typename: 'PricingPercentageValue'}
          >
        ).percentage
      : null;

  return {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  };
}

const FULFILLMENT_LABELS: Record<string, string> = {
  FULFILLED: 'Teljesítve',
  UNFULFILLED: 'Feldolgozás alatt',
  PARTIALLY_FULFILLED: 'Részben teljesítve',
  'N/A': 'Nincs adat',
};

export default function OrderRoute() {
  const {
    order,
    lineItems,
    discountValue,
    discountPercentage,
    fulfillmentStatus,
  } = useLoaderData<typeof loader>();

  return (
    <div className="account-order">
      <div className="order-detail-header">
        <h2>Rendelés {order.name}</h2>
        <div className="order-detail-meta">
          <span>
            {new Date(order.processedAt!).toLocaleDateString('hu-HU', {
              year: 'numeric',
              month: 'long',
              day: 'numeric',
            })}
          </span>
          {order.confirmationNumber && (
            <span>Megerősítés: {order.confirmationNumber}</span>
          )}
        </div>
      </div>

      <table className="order-detail-table">
        <thead>
          <tr>
            <th scope="col">Termék</th>
            <th scope="col">Ár</th>
            <th scope="col">Db</th>
            <th scope="col">Összesen</th>
          </tr>
        </thead>
        <tbody>
          {lineItems.map((lineItem, lineItemIndex) => (
            // eslint-disable-next-line react/no-array-index-key
            <OrderLineRow key={lineItemIndex} lineItem={lineItem} />
          ))}
        </tbody>
        <tfoot>
          {((discountValue && discountValue.amount) ||
            discountPercentage) && (
            <tr>
              <th scope="row" colSpan={3}>
                Kedvezmény
              </th>
              <td>
                {discountPercentage ? (
                  <span>-{discountPercentage}%</span>
                ) : (
                  discountValue && <Money data={discountValue!} />
                )}
              </td>
            </tr>
          )}
          <tr>
            <th scope="row" colSpan={3}>
              Részösszeg
            </th>
            <td>
              <Money data={order.subtotal!} />
            </td>
          </tr>
          <tr>
            <th scope="row" colSpan={3}>
              ÁFA
            </th>
            <td>
              <Money data={order.totalTax!} />
            </td>
          </tr>
          <tr>
            <th scope="row" colSpan={3}>
              Végösszeg
            </th>
            <td>
              <Money data={order.totalPrice!} />
            </td>
          </tr>
        </tfoot>
      </table>

      <div className="order-detail-summary">
        <div className="order-detail-section">
          <h3>Szállítási cím</h3>
          {order?.shippingAddress ? (
            <address>
              <p>{order.shippingAddress.name}</p>
              {order.shippingAddress.formatted && (
                <p>{order.shippingAddress.formatted}</p>
              )}
              {order.shippingAddress.formattedArea && (
                <p>{order.shippingAddress.formattedArea}</p>
              )}
            </address>
          ) : (
            <p>Nincs megadva szállítási cím</p>
          )}
        </div>
        <div className="order-detail-section">
          <h3>Állapot</h3>
          <p>{FULFILLMENT_LABELS[fulfillmentStatus] ?? fulfillmentStatus}</p>
        </div>
      </div>

      <a
        className="order-status-link"
        target="_blank"
        href={order.statusPageUrl}
        rel="noreferrer"
      >
        Rendelés állapota megtekintése →
      </a>
    </div>
  );
}

function OrderLineRow({lineItem}: {lineItem: OrderLineItemFullFragment}) {
  return (
    <tr>
      <td>
        <div className="order-line-product">
          {lineItem?.image && (
            <div className="order-line-image">
              <Image data={lineItem.image} width={60} height={60} />
            </div>
          )}
          <div>
            <p className="order-line-title">{lineItem.title}</p>
            {lineItem.variantTitle && (
              <p className="order-line-variant">{lineItem.variantTitle}</p>
            )}
          </div>
        </div>
      </td>
      <td>
        <Money data={lineItem.price!} />
      </td>
      <td>{lineItem.quantity}</td>
      <td>
        <Money data={lineItem.totalDiscount!} />
      </td>
    </tr>
  );
}
