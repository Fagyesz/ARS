import type {CartLineUpdateInput} from '@shopify/hydrogen/storefront-api-types';
import type {CartLayout, LineItemChildrenMap} from '~/components/CartMain';
import {CartForm, Image, type OptimisticCartLine} from '@shopify/hydrogen';
import {useVariantUrl} from '~/lib/variants';
import {discountLabel} from '~/lib/discounts';
import {formatMoney} from '~/lib/money';
import {Link, useFetcher} from 'react-router';
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
  lines,
  childrenMap,
}: {
  layout: CartLayout;
  line: CartLine;
  /** underlying Shopify lines when several were merged into `line` */
  lines?: CartLine[];
  childrenMap: LineItemChildrenMap;
}) {
  const {id, merchandise} = line;
  const groupLines = lines?.length ? lines : [line];
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
          <SizeSwapForm
            lineId={groupLines.map((l) => l.id).join(',')}
            quantity={line.quantity}
            currentVariantId={merchandise.id}
            selectedOptions={selectedOptions}
            variants={(product as any).variants?.nodes ?? []}
          />
        )}

        <div className="cart-line-actions">
          <CartLineQuantity line={line} lines={groupLines} />
          <div className="cart-line-price">
            <ProductPrice
              price={line?.cost?.totalAmount}
              compareAtPrice={(() => {
                const totalDiscount = (line.discountAllocations ?? []).reduce(
                  (sum, a) => sum + parseFloat(a.discountedAmount.amount),
                  0,
                );
                if (totalDiscount <= 0 || !line.cost?.totalAmount) return undefined;
                return {
                  amount: String(
                    parseFloat(line.cost.totalAmount.amount) + totalDiscount,
                  ),
                  currencyCode: line.cost.totalAmount.currencyCode,
                };
              })()}
            />
            {(line.discountAllocations ?? [])
              .filter((a) => parseFloat(a.discountedAmount.amount) > 0)
              .map((a, i) => (
                <span className="cart-line-discount" key={i}>
                  {discountLabel(a)} · −
                  {formatMoney(a.discountedAmount.amount, a.discountedAmount.currencyCode)}
                </span>
              ))}
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

function CartLineQuantity({line, lines}: {line: CartLine; lines: CartLine[]}) {
  if (!line || typeof line?.quantity === 'undefined') return null;
  const {quantity, isOptimistic} = line;
  const busy = !!isOptimistic;

  // "+" grows the first underlying line; Shopify re-splits discounted units itself
  const first = lines[0];
  const increase = [{id: first.id, quantity: first.quantity + 1}];

  // "−" shrinks a line that still has more than one unit, otherwise drops a
  // whole single-unit line; a lone single-unit line can only be removed
  const shrinkable = lines.find((l) => l.quantity > 1);
  const decreaseUpdate = shrinkable
    ? [{id: shrinkable.id, quantity: shrinkable.quantity - 1}]
    : null;
  const decreaseRemove = !shrinkable && lines.length > 1 ? [lines[lines.length - 1].id] : null;
  const canDecrease = quantity > 1 && (decreaseUpdate || decreaseRemove);

  const decreaseButton = (
    <button
      aria-label="Mennyiség csökkentése"
      disabled={!canDecrease || busy}
      name="decrease-quantity"
      type="submit"
    >
      <span>-</span>
    </button>
  );

  return (
    <div className="cart-line-quantity">
      {decreaseRemove ? (
        <CartForm
          fetcherKey={getUpdateKey(decreaseRemove)}
          route="/cart"
          action={CartForm.ACTIONS.LinesRemove}
          inputs={{lineIds: decreaseRemove}}
        >
          {decreaseButton}
        </CartForm>
      ) : (
        <CartLineUpdateButton lines={decreaseUpdate ?? [{id: first.id, quantity: first.quantity}]}>
          {decreaseButton}
        </CartLineUpdateButton>
      )}
      <span className="cart-line-quantity-value">{quantity}</span>
      <CartLineUpdateButton lines={increase}>
        <button
          aria-label="Mennyiség növelése"
          name="increase-quantity"
          type="submit"
          disabled={busy}
        >
          <span>+</span>
        </button>
      </CartLineUpdateButton>
      <CartLineRemoveButton lineIds={lines.map((l) => l.id)} disabled={busy} />
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

type SizeVariant = {
  id: string;
  availableForSale: boolean;
  selectedOptions: Array<{name: string; value: string}>;
};

function SizeSwapForm({
  lineId,
  quantity,
  currentVariantId,
  selectedOptions,
  variants,
}: {
  lineId: string;
  quantity: number;
  currentVariantId: string;
  selectedOptions: Array<{name: string; value: string}>;
  variants: SizeVariant[];
}) {
  const nonSizeOptions = selectedOptions.filter(
    (opt) => opt.name.toLowerCase() !== 'size' && opt.name.toLowerCase() !== 'méret',
  );

  const sizeVariants = variants.filter((variant) => {
    const hasSize = variant.selectedOptions.some(
      (o) => o.name.toLowerCase() === 'size' || o.name.toLowerCase() === 'méret',
    );
    if (!hasSize) return false;
    return nonSizeOptions.every((opt) =>
      variant.selectedOptions.some((vo) => vo.name === opt.name && vo.value === opt.value),
    );
  });

  const fetcher = useFetcher();

  if (sizeVariants.length === 0) return null;

  return (
    <fetcher.Form method="post" action="/cart" className="cart-line-size">
      <span className="cart-line-size-label">Méret:</span>
      <input type="hidden" name="swapLineId" value={lineId} />
      <input type="hidden" name="swapQuantity" value={quantity} />
      <select
        name="swapVariantId"
        defaultValue={currentVariantId}
        onChange={(e) => {
          e.currentTarget.form?.requestSubmit();
        }}
      >
        {sizeVariants.map((variant) => {
          const sizeValue = variant.selectedOptions.find(
            (o) => o.name.toLowerCase() === 'size' || o.name.toLowerCase() === 'méret',
          )?.value;
          return (
            <option key={variant.id} value={variant.id} disabled={!variant.availableForSale}>
              {sizeValue}{!variant.availableForSale ? ' (Elfogyott)' : ''}
            </option>
          );
        })}
      </select>
    </fetcher.Form>
  );
}

function getUpdateKey(lineIds: string[]) {
  return [CartForm.ACTIONS.LinesUpdate, ...lineIds].join('-');
}
