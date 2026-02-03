import {useNavigate} from 'react-router';
import {type MappedProductOptions} from '@shopify/hydrogen';
import type {
  Maybe,
  ProductOptionValueSwatch,
} from '@shopify/hydrogen/storefront-api-types';
import {AddToCartButton} from './AddToCartButton';
import {useAside} from './Aside';
import type {ProductFragment} from 'storefrontapi.generated';

// Hungarian translations for common option names
const OPTION_TRANSLATIONS: Record<string, string> = {
  Size: 'Méret',
  Color: 'Szín',
  Style: 'Stílus',
  Material: 'Anyag',
};

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
        // If there is only a single value in the option values, don't display the option
        if (option.optionValues.length === 1) return null;

        const optionLabel = OPTION_TRANSLATIONS[option.name] || option.name;

        return (
          <div className="product-option-group" key={option.name}>
            <span className="size-selector-label">{optionLabel}</span>
            <div className="size-selector">
              {option.optionValues.map((value) => {
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

                if (isDifferentProduct) {
                  return (
                    <a
                      className={`size-option ${hasSwatchStyle ? 'swatch' : ''}`}
                      key={option.name + name}
                      href={`/products/${handle}?${variantUriQuery}`}
                      data-selected={selected}
                      data-available={available}
                      style={hasSwatchStyle ? {
                        backgroundColor: swatch?.color || 'transparent',
                        backgroundImage: swatch?.image?.previewImage?.url
                          ? `url(${swatch.image.previewImage.url})`
                          : undefined,
                      } : undefined}
                    >
                      {!hasSwatchStyle && name}
                    </a>
                  );
                } else {
                  return (
                    <button
                      type="button"
                      className={`size-option ${hasSwatchStyle ? 'swatch' : ''}`}
                      key={option.name + name}
                      data-selected={selected}
                      data-available={available}
                      disabled={!exists || !available}
                      onClick={() => {
                        if (!selected && exists) {
                          void navigate(`?${variantUriQuery}`, {
                            replace: true,
                            preventScrollReset: true,
                          });
                        }
                      }}
                      style={hasSwatchStyle ? {
                        backgroundColor: swatch?.color || 'transparent',
                        backgroundImage: swatch?.image?.previewImage?.url
                          ? `url(${swatch.image.previewImage.url})`
                          : undefined,
                      } : undefined}
                      title={!available ? 'Nincs készleten' : name}
                    >
                      {!hasSwatchStyle && name}
                    </button>
                  );
                }
              })}
            </div>
          </div>
        );
      })}
      <AddToCartButton
        disabled={!selectedVariant || !selectedVariant.availableForSale}
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
