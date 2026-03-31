import type {ProductVariantFragment} from 'storefrontapi.generated';
import {Image} from '@shopify/hydrogen';

type ProductImageProps = {
  image?: ProductVariantFragment['image'];
  productTitle?: string;
};

export function ProductImage({
  image,
  productTitle,
}: ProductImageProps) {
  if (!image) {
    return <div className="product-image" />;
  }
  return (
    <div className="product-image">
      <Image
        alt={image.altText || productTitle || 'Ars Mosoris termék'}
        aspectRatio="1/1"
        data={image}
        key={image.id}
        sizes="(min-width: 45em) 50vw, 100vw"
      />
    </div>
  );
}
