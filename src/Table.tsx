import { flexRender, type Table as TableType } from "@tanstack/react-table";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import { useEffect, useRef, useState } from "react";
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
  const tableWrapperRef = useRef<HTMLDivElement>(null);
  const [scrollMargin, setScrollMargin] = useState(0);
  const headerRef = useRef<HTMLDivElement | null>(null);
  const rows = table.getRowModel().rows;

  // Measure distance from the top of the page to the table wrapper.
  // Intentionally runs on every render to stay current when content above shifts.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  useEffect(() => {
    if (tableWrapperRef.current) {
      const top =
        tableWrapperRef.current.getBoundingClientRect().top + window.scrollY;
      setScrollMargin((prev) => (prev !== top ? top : prev));
    }
  });

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

  const rowVirtualizer = useWindowVirtualizer({
    count: rows.length,
    estimateSize: () => 120,
    overscan: 5,
    scrollMargin,
    measureElement:
      typeof window !== "undefined" &&
      navigator.userAgent.indexOf("Firefox") === -1
        ? (element) => element.getBoundingClientRect().height
        : undefined,
  });


  // Sets class on table header when it sticks to the top of the viewport.
  // Reads the actual CSS `top` value so it stays in sync with _variables.scss automatically.
  useEffect(() => {
    const el = headerRef.current;
    if (!el) return;

    const stickyTop = parseFloat(getComputedStyle(el).top) || 0;

    const checkSticky = () => {
      const rect = el.getBoundingClientRect();
      const isStuck = Math.abs(rect.top - stickyTop) < 1;
      el.classList.toggle("is-stuck", isStuck);
    };

    window.addEventListener("scroll", checkSticky, { passive: true });
    window.addEventListener("resize", checkSticky);

    checkSticky();

    return () => {
      window.removeEventListener("scroll", checkSticky);
      window.removeEventListener("resize", checkSticky);
    };
  }, []);

  const virtualRows = rowVirtualizer.getVirtualItems();
  const totalSize = rowVirtualizer.getTotalSize();

  // Calculate padding for non-rendered rows (offset by scrollMargin)
  const paddingTop =
    virtualRows.length > 0 ? virtualRows[0].start - scrollMargin : 0;
  const paddingBottom =
    virtualRows.length > 0
      ? totalSize - virtualRows[virtualRows.length - 1].end
      : 0;

  return (
    <div ref={tableWrapperRef} className="table-wrapper">
      <div className={className}>
        <div className="grid-header" ref={headerRef}>
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
          const isFirstRow = virtualRow.index === 0;
          const matchColumnIds = getMatchColumnIds(row);
          return (
            <div
              key={row.id}
              data-index={virtualRow.index}
              ref={rowVirtualizer.measureElement}
              className={`grid-row${isEvenRow ? " grid-row--even" : " grid-row--odd"}${virtualRow.index === nameMatchBoundaryIndex ? " grid-row--name-match-boundary" : ""}${isFirstRow ? " grid-row--first" : ""}`}
            >
              {row.getVisibleCells().map((cell) => {
                const isHighlighted = matchColumnIds.has(cell.column.id);
                return (
                  <div
                    key={cell.id}
                    className={`grid-cell grid-cell--${cell.column.id}${isHighlighted ? " grid-cell--search-match" : ""}`}
                  >
                    {flexRender(cell.column.columnDef.cell, cell.getContext())}
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
