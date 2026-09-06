import {useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {ProductFragment} from 'storefrontapi.generated';
import {STANDARD_SIZES, isSizeOption} from '~/lib/sizes';

// Hungarian translations for common option names
const OPTION_TRANSLATIONS: Record<string, string> = {
  Size: 'Méret',
  Color: 'Szín',
  Style: 'Stílus',
  Material: 'Anyag',
};

const DEFAULT_SIZE_RUN = ['S', 'M', 'L', 'XL'];

/**
 * Letter-sized garments always show the S–XL row (plus XS/XXL when the product
 * has them), so a size the product doesn't come in reads as "not available"
 * instead of silently vanishing. One-off sizes such as "M-L" or "L-XL" are
 * shown as they are, because a struck-through S M L XL row would mislead there.
 */
export function sizeRun(values: string[]): string[] | null {
  if (!values.length || !values.every((v) => STANDARD_SIZES.includes(v))) {
    return null;
  }
  return STANDARD_SIZES.filter(
    (size) => DEFAULT_SIZE_RUN.includes(size) || values.includes(size),
  );
}

type OptionValue = MappedProductOptions['optionValues'][number];

export function ProductForm({
  productOptions,
  selectedVariant,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
}) {
  const navigate = useNavigate();
  const {open} = useAside();

  return (
    <div className="product-form">
      {productOptions.map((option) => {
        const optionLabel = OPTION_TRANSLATIONS[option.name] || option.name;
        const run = isSizeOption(option.name)
          ? sizeRun(option.optionValues.map((value) => value.name))
          : null;
        // a plain string slot is a size this product doesn't come in
        const slots: Array<OptionValue | string> = run
          ? run.map(
              (size) =>
                option.optionValues.find((value) => value.name === size) ??
                size,
            )
          : option.optionValues;

        return (
          <div className="product-option-group" key={option.name}>
            <span className="size-selector-label">{optionLabel}</span>
            <div className="size-selector">
              {slots.map((slot) =>
                typeof slot === 'string' ? (
                  <button
                    type="button"
                    className="size-option"
                    key={option.name + slot}
                    data-selected={false}
                    data-available={false}
                    disabled
                    title="Ebben a méretben nem elérhető"
                  >
                    {slot}
                  </button>
                ) : (
                  <OptionValueButton
                    key={option.name + slot.name}
                    value={slot}
                    onSelect={(variantUriQuery) => {
                      void navigate(`?${variantUriQuery}`, {
                        replace: true,
                        preventScrollReset: true,
                      });
                    }}
                  />
                ),
              )}
            </div>
          </div>
        );
      })}
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
        successToast={false}
        onClick={() => {
          open('cart');
        }}
        lines={
          selectedVariant
            ? [
                {
                  merchandiseId: selectedVariant.id,
                  quantity: 1,
                  selectedVariant,
                },
              ]
            : []
        }
      >
        {selectedVariant?.availableForSale ? 'Kosárba' : 'Elfogyott'}
      </AddToCartButton>
    </div>
  );
}

function OptionValueButton({
  value,
  onSelect,
}: {
  value: OptionValue;
  onSelect: (variantUriQuery: string) => void;
}) {
  const {
    name,
    handle,
    variantUriQuery,
    selected,
    available,
    exists,
    isDifferentProduct,
    swatch,
  } = value;

  // Check if this is a color swatch
  const hasSwatchStyle = swatch?.color || swatch?.image?.previewImage?.url;
  const swatchStyle = hasSwatchStyle
    ? {
        backgroundColor: swatch?.color || 'transparent',
        backgroundImage: swatch?.image?.previewImage?.url
          ? `url(${swatch.image.previewImage.url})`
          : undefined,
      }
    : undefined;
  const className = `size-option ${hasSwatchStyle ? 'swatch' : ''}`;

  if (isDifferentProduct) {
    return (
      <a
        className={className}
        href={`/products/${handle}?${variantUriQuery}`}
        data-selected={selected}
        data-available={available}
        style={swatchStyle}
      >
        {!hasSwatchStyle && name}
      </a>
    );
  }

  const title = !exists
    ? 'Ebben a kombinációban nem elérhető'
    : !available
      ? 'Nincs készleten'
      : name;

  return (
    <button
      type="button"
      className={className}
      data-selected={selected}
      data-available={available}
      disabled={!exists || !available}
      onClick={() => {
        if (!selected && exists) onSelect(variantUriQuery);
      }}
      style={swatchStyle}
      title={title}
    >
      {!hasSwatchStyle && name}
    </button>
  );
}
