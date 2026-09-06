import {Link} from 'react-router';

/**
 * The catalogue's size chips, rendered inside the filter bar after the sort
 * buttons: one chip per size something is in stock in (see app/lib/sizes.ts).
 * The active chip links back to the unfiltered URL, so it works as a toggle;
 * `hrefFor('')` must give the URL without a size.
 */
export function SizeFilter({
  sizes,
  active,
  hrefFor,
}: {
  sizes: string[];
  active: string;
  hrefFor: (size: string) => string;
}) {
  if (!sizes.length) return null;
  return (
    <>
      <span className="catalog-filter-divider" aria-hidden="true" />
      <div className="catalog-filter-section catalog-size-section" role="group" aria-label="Méret">
        <span className="catalog-size-label">Méret</span>
        {sizes.map((size) => {
          const isActive = active === size;
          return (
            <Link
              key={size}
              to={hrefFor(isActive ? '' : size)}
              className={`catalog-size-chip${isActive ? ' active' : ''}`}
              aria-current={isActive ? 'true' : undefined}
              title={isActive ? 'Méretszűrő törlése' : `Csak ${size} méretben kapható darabok`}
              prefetch="intent"
            >
              {size}
            </Link>
          );
        })}
        {active && (
          <Link to={hrefFor('')} className="catalog-size-clear">
            Minden méret
          </Link>
        )}
      </div>
    </>
  );
}
