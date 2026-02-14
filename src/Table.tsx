import { flexRender, type Table as TableType } from "@tanstack/react-table";
import { useVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef } from "react";
import MobileItemRow from "./components/MobileItemRow";
import { MEDIA_QUERIES } from "./constants/breakpoints";
import { useMediaQuery } from "./hooks/useMediaQuery";
import type { Item } from "./types";
import type { SearchMatchType } from "./utils/functions";
import type { CachedMaterial } from "./utils/tableCache";

type TableProps<T> = {
  table: TableType<T>;
  className?: string;
  // Optional props for mobile view (only used when T is Item)
  sortedMaterialsCache?: Record<string, CachedMaterial[]>;
  searchMatchTypes?: Record<string, Set<SearchMatchType>>;
  nameMatchBoundaryIndex?: number;
};

const Table = <T,>({
  table,
  className,
  sortedMaterialsCache,
  searchMatchTypes,
  nameMatchBoundaryIndex = -1,
}: TableProps<T>) => {
  const isMobileOrTablet = useMediaQuery(MEDIA_QUERIES.tabletAndBelow);
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

  // Mobile/Tablet view - render cards instead of table
  if (
    isMobileOrTablet &&
    className === "items-table" &&
    sortedMaterialsCache
  ) {
    return (
      <div ref={tableContainerRef} className="mobile-items-container">
        {paddingTop > 0 && <div style={{ height: `${paddingTop}px` }} />}
        {virtualRows.map((virtualRow) => {
          const row = rows[virtualRow.index];
          const item = row.original as Item;
          return (
            <div
              key={row.id}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
            >
              <MobileItemRow
                item={item}
                sortedMaterialsCache={sortedMaterialsCache}
                index={virtualRow.index}
              />
            </div>
          );
        })}
        {paddingBottom > 0 && <div style={{ height: `${paddingBottom}px` }} />}
      </div>
    );
  }

  // Desktop view - render table
  return (
    <div ref={tableContainerRef} className="table-scroll-container">
      <table id="table" className={className}>
        <colgroup>
          {table.getAllColumns().map((column) => (
            <col key={column.id} style={{ width: `${column.getSize()}px` }} />
          ))}
        </colgroup>
        <thead className="table-header">
          {table.getHeaderGroups().map((headerGroup) => (
            <tr key={headerGroup.id} className="table-row">
              {headerGroup.headers.map((header) => (
                <th
                  key={header.id}
                  className={`table-cell ${header.column.id}`}
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
                </th>
              ))}
            </tr>
          ))}
        </thead>
        <tbody className="table-body">
          {paddingTop > 0 && (
            <tr>
              <td style={{ height: `${paddingTop}px` }} />
            </tr>
          )}
          {virtualRows.map((virtualRow) => {
            const row = rows[virtualRow.index];
            // Use actual data index for alternating row colors (not DOM index)
            const isEvenRow = virtualRow.index % 2 === 0;
            const matchColumnIds = getMatchColumnIds(row);
            return (
              <tr
                key={row.id}
                data-index={virtualRow.index}
                ref={rowVirtualizer.measureElement}
                className={`table-row${isEvenRow ? " table-row--even" : " table-row--odd"}${virtualRow.index === nameMatchBoundaryIndex ? " table-row--name-match-boundary" : ""}`}
              >
                {row.getVisibleCells().map((cell, cellIndex) => {
                  const isHighlighted = matchColumnIds.has(cell.column.id);
                  return (
                    <td
                      key={cell.id}
                      className={`table-cell${cellIndex === 0 ? ` ${cell.column.id}` : ""}${isHighlighted ? " table-cell--search-match" : ""}`}
                    >
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </td>
                  );
                })}
              </tr>
            );
          })}
          {paddingBottom > 0 && (
            <tr>
              <td style={{ height: `${paddingBottom}px` }} />
            </tr>
          )}
        </tbody>
      </table>
    </div>
  );
};

export default Table;
