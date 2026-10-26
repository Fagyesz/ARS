import {redirect, useLoaderData} from 'react-router';
import type {Route} from './+types/account.orders.$id';
import {seoMeta} from '~/lib/seo';
import {Image} from '@shopify/hydrogen';
import {formatMoney} from '~/lib/money';
import {orderStatus, refundSummary} from '~/lib/order-status';
import type {
  OrderLineItemFullFragment,
  OrderQuery,
} from 'customer-accountapi.generated';
import {CUSTOMER_ORDER_QUERY} from '~/graphql/customer-account/CustomerOrderQuery';

export const meta: Route.MetaFunction = ({data, location}) =>
  seoMeta({
    title: data?.order?.name ? `Rendelés ${data.order.name}` : 'Rendelés',
    path: location.pathname,
    noindex: true,
  });

export async function loader({params, context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  if (!params.id) {
    return redirect('/account/orders');
  }

  // a mangled link (not base64) is a missing order, not a server error
  let orderId: string;
  try {
    orderId = atob(params.id);
  } catch {
    throw new Response('Order not found', {status: 404});
  }
  const {data, errors}: {data: OrderQuery; errors?: Array<{message: string}>} =
    await customerAccount.query(CUSTOMER_ORDER_QUERY, {
      variables: {
        orderId,
        language: customerAccount.i18n.language,
      },
    });

  // unknown, foreign or malformed order ids come back as errors or a null order
  if (errors?.length || !data?.order) {
    if (errors?.length) console.error('[order] query failed:', errors);
    throw new Response('Order not found', {status: 404});
  }

  const {order} = data;

  const lineItems = order.lineItems.nodes;
  const amount = (m?: {amount: string} | null) => Number(m?.amount ?? 0);

  // amounts as sold: after a refund Shopify lowers totalPrice and the current line totals
  const subtotal = lineItems.reduce(
    (sum, l) => sum + (l.soldTotalPrice ? amount(l.soldTotalPrice) : amount(l.price) * l.quantity),
    0,
  );
  const discount = lineItems.reduce(
    (sum, l) =>
      sum + (l.soldTotalPrice && l.soldDiscountedTotalPrice
        ? amount(l.soldTotalPrice) - amount(l.soldDiscountedTotalPrice)
        : amount(l.totalDiscount)),
    0,
  );
  const shipping =
    amount(order.shippingLine?.originalPrice) -
    order.shippingDiscountAllocations.reduce((sum, a) => sum + amount(a.allocatedAmount), 0);
  const refund = refundSummary(order.transactions);

  // parcel tracking: every fulfillment with a number or a link (FoxPost); none once cancelled
  const tracking = order.cancelledAt
    ? []
    : order.fulfillments.nodes
        .flatMap((f) => f.trackingInformation)
        .filter((t) => t.number || t.url);

  return {
    order,
    lineItems,
    totals: {subtotal, discount, shipping, total: subtotal - discount + shipping, refund},
    status: orderStatus(order),
    tracking,
  };
}
export default function OrderRoute() {
  const {order, lineItems, totals, status, tracking} = useLoaderData<typeof loader>();
  const currency = order.totalPrice.currencyCode;
  const money = (value: number) => formatMoney(value, currency);

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
          <tr>
            <th scope="row" colSpan={3}>
              Részösszeg
            </th>
            <td>{money(totals.subtotal)}</td>
          </tr>
          {totals.discount > 0 && (
            <tr>
              <th scope="row" colSpan={3}>
                Kedvezmény
              </th>
              <td>{money(-totals.discount)}</td>
            </tr>
          )}
          {order.shippingLine && (
            <tr>
              <th scope="row" colSpan={3}>
                Szállítás ({order.shippingLine.title})
              </th>
              <td>{totals.shipping > 0 ? money(totals.shipping) : 'Ingyenes'}</td>
            </tr>
          )}
          <tr>
            <th scope="row" colSpan={3}>
              Végösszeg
            </th>
            <td>{money(totals.total)}</td>
          </tr>
          {totals.refund.amount > 0 && (
            <tr className="order-refund-row">
              <th scope="row" colSpan={3}>
                {totals.refund.pending ? 'Visszatérítés folyamatban' : 'Visszatérítve'}
              </th>
              <td>{money(-totals.refund.amount)}</td>
            </tr>
          )}
        </tfoot>
      </table>

      <div className="order-detail-summary">
        <div className="order-detail-section">
          <h3>Szállítási cím</h3>
          {order?.shippingAddress ? (
            <address>
              {order.shippingAddress.formatted.map((line) => (
                <p key={line}>{line}</p>
              ))}
            </address>
          ) : (
            <p>Nincs megadva szállítási cím</p>
          )}
        </div>
        <div className="order-detail-section">
          <h3>Állapot</h3>
          <p>
            <span className={`order-status-badge ${status.tone}`}>{status.label}</span>
          </p>
          {tracking.map((t, i) => (
            // eslint-disable-next-line react/no-array-index-key
            <p key={i} className="order-tracking">
              {t.url && (
                <a href={t.url} target="_blank" rel="noopener noreferrer">
                  Csomag követése →
                </a>
              )}
              {t.number && (
                <span className="order-tracking-number">
                  {' '}
                  Csomagszám: {t.number}
                </span>
              )}
            </p>
          ))}
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
      <td>{lineItem.price && formatMoney(lineItem.price.amount, lineItem.price.currencyCode)}</td>
      <td>{lineItem.quantity}</td>
      <td>
        {formatMoney(
          lineItem.soldTotalPrice?.amount ??
            Number(lineItem.price?.amount ?? 0) * lineItem.quantity,
          lineItem.price?.currencyCode,
        )}
      </td>
    </tr>
  );
}
