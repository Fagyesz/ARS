import {Money} from '@shopify/hydrogen';
import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';

function formatMoney(data: MoneyV2) {
  const amount = parseFloat(data.amount);
  const formatted = new Intl.NumberFormat('hu-HU', {
    style: 'currency',
    currency: data.currencyCode,
    minimumFractionDigits: data.currencyCode === 'HUF' ? 0 : 2,
    maximumFractionDigits: data.currencyCode === 'HUF' ? 0 : 2,
  }).format(amount);
  return formatted;
}

export function ProductPrice({
  price,
  compareAtPrice,
}: {
  price?: MoneyV2;
  compareAtPrice?: MoneyV2 | null;
}) {
  return (
    <div className="product-price">
      {compareAtPrice ? (
        <div className="product-price-on-sale">
          {price ? <span>{formatMoney(price)}</span> : null}
          <s>{formatMoney(compareAtPrice)}</s>
        </div>
      ) : price ? (
        <span>{formatMoney(price)}</span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}
