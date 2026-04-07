import * as React from 'react';
import {Pagination} from '@shopify/hydrogen';

export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  resourcesClassName,
  renderMeta,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  resourcesClassName?: string;
  renderMeta?: (args: {count: number; hasNextPage: boolean; isLoading: boolean}) => React.ReactNode;
}) {
  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, NextLink, pageInfo}) => (
        <div>
          {renderMeta?.({count: nodes.length, hasNextPage: pageInfo.hasNextPage, isLoading})}
          {resourcesClassName ? (
            <div className={resourcesClassName}>
              {nodes.map((node, index) => children({node, index}))}
            </div>
          ) : (
            nodes.map((node, index) => children({node, index}))
          )}
          {/* Silently fetch all remaining pages in background — no scroll trigger needed */}
          <EagerLoadTrigger isLoading={isLoading} NextLink={NextLink} />
        </div>
      )}
    </Pagination>
  );
}

function EagerLoadTrigger({
  isLoading,
  NextLink,
}: {
  isLoading: boolean;
  NextLink: React.ComponentType<{children: React.ReactNode}>;
}) {
  const linkRef = React.useRef<HTMLDivElement>(null);
  const isLoadingRef = React.useRef(isLoading);
  const firedRef = React.useRef(false);

  React.useEffect(() => {
    isLoadingRef.current = isLoading;
  });

  React.useEffect(() => {
    // As soon as this sentinel mounts (next page exists) and we're not
    // already loading, immediately fetch the next page — no scroll needed.
    const timer = setTimeout(() => {
      if (!isLoadingRef.current && !firedRef.current) {
        firedRef.current = true;
        linkRef.current?.querySelector('a')?.click();
      }
    }, 80); // tiny delay so React finishes painting current batch first
    return () => clearTimeout(timer);
  }, []);

  return (
    <div
      ref={linkRef}
      aria-hidden="true"
      className="pagination-eager-trigger"
    >
      <NextLink>more</NextLink>
    </div>
  );
}
