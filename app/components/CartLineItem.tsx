import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {CartForm, Image, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {Link} from 'react-router';
import {ProductPrice} from './ProductPrice';
import {useAside} from './Aside';
import type {
  CartApiQueryFragment,
  CartLineFragment,
} from 'storefrontapi.generated';

export type CartLine = OptimisticCartLine<CartApiQueryFragment>;

export function CartLineItem({
  layout,
  line,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const {product, title, image, selectedOptions} = merchandise;
  const lineItemUrl = useVariantUrl(product.handle, selectedOptions);
  const {close} = useAside();
  const lineItemChildren = childrenMap[id];

  // Get the current size option (if any)
  const sizeOption = selectedOptions.find(
    (opt) => opt.name.toLowerCase() === 'size' || opt.name.toLowerCase() === 'méret'
  );

  return (
    <li key={id} className="cart-line">
      <div className="cart-line-image">
        {image && (
          <Image
            alt={title}
            aspectRatio="1/1"
            data={image}
            height={100}
            loading="lazy"
            width={100}
          />
        )}
      </div>

      <div className="cart-line-details">
        <Link
          prefetch="intent"
          to={lineItemUrl}
          onClick={() => {
            if (layout === 'aside') {
              close();
            }
          }}
          className="cart-line-title"
        >
          {product.title}
        </Link>

        {/* Display non-size options as text */}
        <div className="cart-line-variant">
          {selectedOptions
            .filter((opt) => opt.name.toLowerCase() !== 'size' && opt.name.toLowerCase() !== 'méret')
            .map((option) => (
              <span key={option.name}>
                {option.name}: {option.value}
              </span>
            ))}
        </div>

        {/* Inline size selector */}
        {sizeOption && (
          <div className="cart-line-size">
            <span className="cart-line-size-label">Méret: </span>
            <span className="cart-line-size-value">{sizeOption.value}</span>
          </div>
        )}

        <div className="cart-line-actions">
          <CartLineQuantity line={line} />
          <div className="cart-line-price">
            <ProductPrice price={line?.cost?.totalAmount} />
          </div>
        </div>
      </div>

      {lineItemChildren ? (
        <ul className="cart-line-children">
          {lineItemChildren.map((childLine) => (
            <CartLineItem
              childrenMap={childrenMap}
              key={childLine.id}
              line={childLine}
              layout={layout}
            />
          ))}
        </ul>
      ) : null}
    </li>
  );
}

function CartLineQuantity({line}: {line: CartLine}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {id: lineId, quantity, isOptimistic} = line;
  const prevQuantity = Number(Math.max(0, quantity - 1).toFixed(0));
  const nextQuantity = Number((quantity + 1).toFixed(0));

  return (
    <div className="cart-line-quantity">
      <CartLineUpdateButton lines={[{id: lineId, quantity: prevQuantity}]}>
        <button
          aria-label="Mennyiség csökkentése"
          disabled={quantity <= 1 || !!isOptimistic}
          name="decrease-quantity"
          value={prevQuantity}
        >
          <span>-</span>
        </button>
      </CartLineUpdateButton>
      <span className="cart-line-quantity-value">{quantity}</span>
      <CartLineUpdateButton lines={[{id: lineId, quantity: nextQuantity}]}>
        <button
          aria-label="Mennyiség növelése"
          name="increase-quantity"
          value={nextQuantity}
          disabled={!!isOptimistic}
        >
          <span>+</span>
        </button>
      </CartLineUpdateButton>
      <CartLineRemoveButton lineIds={[lineId]} disabled={!!isOptimistic} />
    </div>
  );
}

function CartLineRemoveButton({
  lineIds,
  disabled,
}: {
  lineIds: string[];
  disabled: boolean;
}) {
  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesRemove}
      inputs={{lineIds}}
    >
      <button disabled={disabled} type="submit" className="cart-line-remove" aria-label="Eltávolítás">
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <path d="M3 6h18" />
          <path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6" />
          <path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2" />
        </svg>
      </button>
    </CartForm>
  );
}

function CartLineUpdateButton({
  children,
  lines,
}: {
  children: React.ReactNode;
  lines: CartLineUpdateInput[];
}) {
  const lineIds = lines.map((line) => line.id);

  return (
    <CartForm
      fetcherKey={getUpdateKey(lineIds)}
      route="/cart"
      action={CartForm.ACTIONS.LinesUpdate}
      inputs={{lines}}
    >
      {children}
    </CartForm>
  );
}

function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
