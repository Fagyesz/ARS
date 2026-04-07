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
      {({nodes, isLoading, NextLink, hasNextPage}) => (
        <div>
          {renderMeta?.({count: nodes.length, hasNextPage, isLoading})}
          {resourcesClassName ? (
            <div className={resourcesClassName}>
              {nodes.map((node, index) => children({node, index}))}
            </div>
          ) : (
            nodes.map((node, index) => children({node, index}))
          )}
          {hasNextPage && (
            <div className="pagination-next">
              <NextLink>Több termék</NextLink>
            </div>
          )}
        </div>
      )}
    </Pagination>
  );
}
