import { flexRender, type Table as TableType } from "@tanstack/react-table";

type TableProps<T> = {
  table: TableType<T>;
  className?: string;
};

const Table = <T,>({ table, className }: TableProps<T>) => {
  return (
    <table id="table" className={className}>
      <thead className="table-header">
        {table.getHeaderGroups().map((headerGroup) => (
          <tr key={headerGroup.id} className="table-row">
            {headerGroup.headers.map((header) => (
              <th key={header.id} className="table-cell">
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
                      header.getContext()
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
        {table.getRowModel().rows.map((row) => (
          <tr key={row.id} className="table-row">
            {row.getVisibleCells().map((cell) => (
              <td key={cell.id} className="table-cell">
                {flexRender(cell.column.columnDef.cell, cell.getContext())}
              </td>
            ))}
          </tr>
        ))}
      </tbody>
      <tfoot className="table-footer">
        {table.getFooterGroups().map((footerGroup) => (
          <tr key={footerGroup.id} className="table-row">
            {footerGroup.headers.map((header) => (
              <th key={header.id} className="table-cell">
                {header.isPlaceholder
                  ? null
                  : flexRender(
                      header.column.columnDef.footer,
                      header.getContext()
                    )}
              </th>
            ))}
          </tr>
        ))}
      </tfoot>
    </table>
  );
};

export default Table;
