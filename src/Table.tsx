import { flexRender, type Table as TableType } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import type { Item } from "./types";
import type { SearchMatchType } from "./utils/functions";

type TableProps<T> = {
  table: TableType<T>;
  className?: string;
  searchMatchTypes?: Record<string, Set<SearchMatchType>>;
  nameMatchBoundaryIndex?: number;
};

const Table = <T,>({
  table,
  className,
  searchMatchTypes,
  nameMatchBoundaryIndex = -1,
}: TableProps<T>) => {
  const tableContainerRef = useRef<HTMLDivElement>(null);
  const rows = table.getRowModel().rows;

  // Map search match types to the column ID that should be highlighted
  const matchTypeToColumnId: Record<SearchMatchType, string> = {
    item: "item",
    recycles: "recycles",
    salvages: "salvages",
    requirement: "neededFor",
  };

  const getMatchColumnIds = (row: (typeof rows)[0]): Set<string> => {
    if (!searchMatchTypes) return new Set();
    const item = row.original as Item;
    const types = searchMatchTypes[item.id];
    if (!types) return new Set();
    const columnIds = new Set<string>();
    for (const type of types) {
      columnIds.add(matchTypeToColumnId[type]);
    }
    return columnIds;
  };

  const rowVirtualizer = useVirtualizer({
    count: rows.length,
    getScrollElement: () => tableContainerRef.current,
    estimateSize: () => 120, // Initial estimate, will be measured dynamically
    overscan: 5, // Reduced overscan for better performance
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element.getBoundingClientRect().height
        : undefined, // Dynamic measurement (disabled on Firefox due to bugs)
  });

  // Reset scroll position when sorting changes
  const sorting = table.getState().sorting;
  useEffect(() => {
    rowVirtualizer.scrollToIndex(0);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorting]);

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Calculate padding for non-rendered rows
  const paddingTop = virtualRows.length > 0 ? virtualRows[0].start : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div ref={tableContainerRef} className="table-scroll-container">
      <div className={className}>
        <div className="grid-header">
          {table.getHeaderGroups().map((headerGroup) =>
            headerGroup.headers.map((header) => (
              <div
                key={header.id}
                className={`grid-header-cell ${header.column.id}`}
              >
                {header.isPlaceholder ? null : (
                  <div
                    className={
                      header.column.getCanSort()
                        ? "cursor-pointer select-none"
                        : ""
                    }
                    onClick={
                      header.column.getCanSort()
                        ? header.column.getToggleSortingHandler()
                        : undefined
                    }
                    title={
                      header.column.getCanSort()
                        ? header.column.getNextSortingOrder() === "asc"
                          ? "Sort ascending"
                          : header.column.getNextSortingOrder() === "desc"
                            ? "Sort descending"
                            : "Clear sort"
                        : undefined
                    }
                  >
                    {flexRender(
                      header.column.columnDef.header,
                      header.getContext(),
                    )}
                    {{
                      asc: " 🔼",
                      desc: " 🔽",
                    }[header.column.getIsSorted() as string] ?? null}
                  </div>
                )}
              </div>
            )),
          )}
        </div>
        {paddingTop > 0 && <div style={{ height: `${paddingTop}px` }} />}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          const isEvenRow = virtualRow.index % 2 === 0;
          const matchColumnIds = getMatchColumnIds(row);
          return (
            <div
              key={row.id}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className={`grid-row${isEvenRow ? " grid-row--even" : " grid-row--odd"}${virtualRow.index === nameMatchBoundaryIndex ? " grid-row--name-match-boundary" : ""}`}
            >
              {row.getVisibleCells().map((cell) => {
                const isHighlighted = matchColumnIds.has(cell.column.id);
                return (
                  <div
                    key={cell.id}
                    className={`grid-cell grid-cell--${cell.column.id}${isHighlighted ? " grid-cell--search-match" : ""}`}
                  >
                    {flexRender(
                      cell.column.columnDef.cell,
                      cell.getContext(),
                    )}
                  </div>
                );
              })}
            </div>
          );
        })}
        {paddingBottom > 0 && <div style={{ height: `${paddingBottom}px` }} />}
      </div>
    </div>
  );
};

export default Table;
