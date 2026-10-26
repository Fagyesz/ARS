// NOTE: https://shopify.dev/docs/api/customer/latest/queries/customer
export const DASHBOARD_ORDERS_QUERY = `#graphql
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
          fulfillmentStatus
          cancelledAt
          transactions {
            kind
            status
            transactionAmount {
              presentmentMoney {
                amount
                currencyCode
              }
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
