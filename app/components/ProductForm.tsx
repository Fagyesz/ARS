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
  onOptionSelect,
}: {
  productOptions: MappedProductOptions[];
  selectedVariant: ProductFragment['selectedOrFirstAvailableVariant'];
  /** told which option the shopper picked (the sticky bar waits for a size) */
  onOptionSelect?: (optionName: string) => void;
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

        const labelId = `option-label-${option.name.replace(/\W+/g, '-')}`;

        return (
          <div className="product-option-group" key={option.name}>
            <span className="size-selector-label" id={labelId}>{optionLabel}</span>
            <div className="size-selector" role="radiogroup" aria-labelledby={labelId}>
              {slots.map((slot) =>
                typeof slot === 'string' ? (
                  <button
                    type="button"
                    role="radio"
                    aria-checked={false}
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
                      onOptionSelect?.(option.name);
                      // picking the size that is already selected confirms it
                      if (slot.selected) return;
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
  // a colour swatch has no text, so it needs its name as the accessible label
  const label = hasSwatchStyle ? name : undefined;

  if (isDifferentProduct) {
    return (
      <a
        className={className}
        href={`/products/${handle}?${variantUriQuery}`}
        role="radio"
        aria-checked={selected}
        aria-label={label}
        data-selected={selected}
        data-available={available}
        style={swatchStyle}
      >
        {!hasSwatchStyle && name}
      </a>
    );
  }

  // A sold-out size stays selectable: the shopper sees "Elfogyott" on the
  // disabled add-to-cart button and can ask for a back-in-stock e-mail.
  const title = !exists
    ? 'Ebben a kombinációban nem elérhető'
    : !available
      ? 'Elfogyott'
      : name;

  return (
    <button
      type="button"
      role="radio"
      aria-checked={selected}
      aria-label={label && (available ? label : `${label} – elfogyott`)}
      className={className}
      data-selected={selected}
      data-available={available}
      disabled={!exists}
      onClick={() => {
        if (exists) onSelect(variantUriQuery);
      }}
      style={swatchStyle}
      title={title}
    >
      {!hasSwatchStyle && name}
    </button>
  );
}
