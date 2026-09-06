import type {MoneyV2} from '@shopify/hydrogen/storefront-api-types';
import {formatMoney} from '~/lib/money';

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
          {price ? <span>{formatMoney(price.amount, price.currencyCode)}</span> : null}
          <s>{formatMoney(compareAtPrice.amount, compareAtPrice.currencyCode)}</s>
        </div>
      ) : price ? (
        <span>{formatMoney(price.amount, price.currencyCode)}</span>
      ) : (
        <span>&nbsp;</span>
      )}
    </div>
  );
}
