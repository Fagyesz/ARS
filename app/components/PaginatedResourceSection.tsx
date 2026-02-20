import * as React from 'react';
import {Pagination} from '@shopify/hydrogen';

export function PaginatedResourceSection<NodesType>({
  connection,
  children,
  resourcesClassName,
}: {
  connection: React.ComponentProps<typeof Pagination<NodesType>>['connection'];
  children: React.FunctionComponent<{node: NodesType; index: number}>;
  resourcesClassName?: string;
}) {
  return (
    <Pagination connection={connection}>
      {({nodes, isLoading, NextLink}) => (
        <div>
          {resourcesClassName ? (
            <div className={resourcesClassName}>
              {nodes.map((node, index) => children({node, index}))}
            </div>
          ) : (
            nodes.map((node, index) => children({node, index}))
          )}
          <AutoLoadTrigger isLoading={isLoading} NextLink={NextLink} />
        </div>
      )}
    </Pagination>
  );
}

function AutoLoadTrigger({
  isLoading,
  NextLink,
}: {
  isLoading: boolean;
  NextLink: React.ComponentType<{children: React.ReactNode}>;
}) {
  const sentinelRef = React.useRef<HTMLDivElement>(null);
  const isLoadingRef = React.useRef(isLoading);

  // Keep ref current without recreating the observer on every render
  React.useEffect(() => {
    isLoadingRef.current = isLoading;
  });

  React.useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting && !isLoadingRef.current) {
          sentinel.querySelector('a')?.click();
        }
      },
      {rootMargin: '400px'}, // trigger 400px before sentinel enters view
    );

    observer.observe(sentinel);
    return () => observer.disconnect();
  }, []);

  return (
    <>
      {isLoading && (
        <div className="pagination-loading">
          <span className="pagination-spinner" />
        </div>
      )}
      {/* Invisible sentinel — IntersectionObserver watches this */}
      <div
        ref={sentinelRef}
        aria-hidden="true"
        style={{opacity: 0, pointerEvents: 'none', height: '1px'}}
      >
        <NextLink>more</NextLink>
      </div>
    </>
  );
}
