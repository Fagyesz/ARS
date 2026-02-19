import {Link, useLoaderData, useOutletContext} from 'react-router';
import type {Route} from './+types/account._index';
import {Money} from '@shopify/hydrogen';
import type {CurrencyCode} from '@shopify/hydrogen/storefront-api-types';
import type {CustomerFragment} from 'customer-accountapi.generated';

type DashboardOrder = {
  id: string;
  number: number;
  processedAt: string;
  financialStatus: string | null;
  fulfillments: {nodes: Array<{status: string}>};
  totalPrice: {amount: string; currencyCode: CurrencyCode};
  lineItems: {
    nodes: Array<{
      title: string;
      quantity: number;
      image: {url: string; altText: string | null; width: number | null; height: number | null} | null;
    }>;
  };
};

const DASHBOARD_ORDERS_QUERY = `#graphql
  query DashboardOrders($language: LanguageCode) @inContext(language: $language) {
    customer {
      emailAddress {
        emailAddress
      }
      orders(first: 5, sortKey: PROCESSED_AT, reverse: true) {
        nodes {
          id
          number
          processedAt
          financialStatus
          fulfillments(first: 1) {
            nodes {
              status
            }
          }
          totalPrice {
            amount
            currencyCode
          }
          lineItems(first: 2) {
            nodes {
              title
              quantity
              image {
                url
                altText
                width
                height
              }
            }
          }
        }
      }
    }
  }
` as const;

export const meta: Route.MetaFunction = () => {
  return [{title: 'Fiókom | Ars Mosoris'}];
};

export async function loader({context}: Route.LoaderArgs) {
  const {customerAccount} = context;
  await context.customerAccount.handleAuthStatus();

  const {data, errors} = await customerAccount.query(DASHBOARD_ORDERS_QUERY, {
    variables: {language: customerAccount.i18n.language},
  });

  if (errors?.length || !data?.customer) {
    return {recentOrders: [] as DashboardOrder[], email: null};
  }

  return {
    recentOrders: data.customer.orders.nodes as DashboardOrder[],
    email: data.customer.emailAddress?.emailAddress ?? null,
  };
}

const FINANCIAL_STATUS: Record<string, {label: string; color: string}> = {
  PAID: {label: 'Fizetve', color: 'paid'},
  PENDING: {label: 'Függőben', color: 'pending'},
  REFUNDED: {label: 'Visszatérítve', color: 'refunded'},
  PARTIALLY_REFUNDED: {label: 'Részben visszatérítve', color: 'refunded'},
  VOIDED: {label: 'Érvénytelenítve', color: 'pending'},
};

const FULFILLMENT_STATUS: Record<string, {label: string; step: number}> = {
  UNFULFILLED: {label: 'Feldolgozás alatt', step: 1},
  IN_PROGRESS: {label: 'Folyamatban', step: 2},
  ON_HOLD: {label: 'Várakoztatva', step: 2},
  PARTIALLY_FULFILLED: {label: 'Részben teljesítve', step: 3},
  FULFILLED: {label: 'Kiszállítva', step: 4},
  RETURNED: {label: 'Visszaküldve', step: 4},
  RESTOCKED: {label: 'Visszatárolt', step: 4},
};

export default function AccountDashboard() {
  const {recentOrders, email} = useLoaderData<typeof loader>();
  const {customer} = useOutletContext<{customer: CustomerFragment}>();

  return (
    <div className="account-dashboard">
      {/* Recent Orders */}
      <section className="dashboard-section">
        <div className="dashboard-section-header">
          <h2 className="dashboard-section-title">Rendeléseim</h2>
          {recentOrders.length > 0 && (
            <Link to="/account/orders" className="dashboard-see-all">
              Összes rendelés →
            </Link>
          )}
        </div>

        {recentOrders.length === 0 ? (
          <div className="dashboard-empty">
            <div className="dashboard-empty-icon">
              <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M6 2 3 6v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2V6l-3-4z" />
                <line x1="3" y1="6" x2="21" y2="6" />
                <path d="M16 10a4 4 0 0 1-8 0" />
              </svg>
            </div>
            <p>Még nincs rendelésed.</p>
            <Link to="/collections/all" className="btn btn-primary">
              Kezdj el vásárolni
            </Link>
          </div>
        ) : (
          <div className="dashboard-orders">
            {recentOrders.map((order) => {
              const fulfillmentStatus =
                order.fulfillments.nodes[0]?.status ?? 'UNFULFILLED';
              const statusInfo = FULFILLMENT_STATUS[fulfillmentStatus] ?? {
                label: fulfillmentStatus,
                step: 1,
              };
              const financialInfo = FINANCIAL_STATUS[order.financialStatus ?? ''];
              const firstImage = order.lineItems.nodes[0]?.image;
              const itemCount = order.lineItems.nodes.reduce(
                (sum, item) => sum + item.quantity,
                0,
              );

              return (
                <Link
                  key={order.id}
                  to={`/account/orders/${btoa(order.id)}`}
                  className="dashboard-order-card"
                >
                  <div className="dashboard-order-image">
                    {firstImage ? (
                      <img
                        src={firstImage.url}
                        alt={firstImage.altText ?? order.lineItems.nodes[0]?.title}
                        width={72}
                        height={72}
                      />
                    ) : (
                      <div className="dashboard-order-image-placeholder">
                        <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                          <rect x="3" y="3" width="18" height="18" rx="2" />
                          <circle cx="8.5" cy="8.5" r="1.5" />
                          <polyline points="21 15 16 10 5 21" />
                        </svg>
                      </div>
                    )}
                  </div>

                  <div className="dashboard-order-info">
                    <div className="dashboard-order-top">
                      <span className="dashboard-order-number">#{order.number}</span>
                      <span className="dashboard-order-date">
                        {new Date(order.processedAt).toLocaleDateString('hu-HU', {
                          year: 'numeric',
                          month: 'short',
                          day: 'numeric',
                        })}
                      </span>
                    </div>

                    <p className="dashboard-order-items">
                      {order.lineItems.nodes[0]?.title}
                      {itemCount > 1 && ` +${itemCount - 1} további termék`}
                    </p>

                    <div className="dashboard-order-status-row">
                      {financialInfo && (
                        <span className={`order-status-badge ${financialInfo.color}`}>
                          {financialInfo.label}
                        </span>
                      )}
                      <span className="order-status-badge fulfillment">
                        {statusInfo.label}
                      </span>
                    </div>

                    <OrderProgressBar step={statusInfo.step} />
                  </div>

                  <div className="dashboard-order-price">
                    <Money data={order.totalPrice} />
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </section>

      {/* Quick Actions */}
      <section className="dashboard-section">
        <h2 className="dashboard-section-title">Fiókbeállítások</h2>
        <div className="dashboard-quick-links">
          <Link to="/account/profile" className="dashboard-quick-card">
            <div className="dashboard-quick-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" />
                <circle cx="12" cy="7" r="4" />
              </svg>
            </div>
            <div>
              <strong>Profilom</strong>
              <p>
                {customer.firstName || customer.lastName
                  ? `${customer.firstName ?? ''} ${customer.lastName ?? ''}`.trim()
                  : 'Személyes adatok'}
              </p>
            </div>
            <span className="dashboard-quick-arrow">→</span>
          </Link>

          <Link to="/account/addresses" className="dashboard-quick-card">
            <div className="dashboard-quick-icon">
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
            </div>
            <div>
              <strong>Szállítási címeim</strong>
              <p>
                {customer.addresses.nodes.length > 0
                  ? `${customer.addresses.nodes.length} mentett cím`
                  : 'Nincs mentett cím'}
              </p>
            </div>
            <span className="dashboard-quick-arrow">→</span>
          </Link>

          {email && (
            <div className="dashboard-quick-card dashboard-quick-card--static">
              <div className="dashboard-quick-icon">
                <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" />
                  <polyline points="22,6 12,13 2,6" />
                </svg>
              </div>
              <div>
                <strong>E-mail cím</strong>
                <p>{email}</p>
              </div>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function OrderProgressBar({step}: {step: number}) {
  const steps = [
    {label: 'Leadva', icon: '✓'},
    {label: 'Feldolgozás', icon: '○'},
    {label: 'Csomagolás', icon: '○'},
    {label: 'Kiszállítva', icon: '○'},
  ];

  return (
    <div className="order-progress">
      {steps.map((s, i) => (
        <div
          key={s.label}
          className={`order-progress-step${i < step ? ' done' : i === step - 1 ? ' active' : ''}`}
        >
          <div className="order-progress-dot" />
          {i < steps.length - 1 && <div className="order-progress-line" />}
        </div>
      ))}
    </div>
  );
}
