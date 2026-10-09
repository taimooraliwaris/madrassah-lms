import { useState, type ReactNode } from "react";
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type SortingState,
  type RowSelectionState,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowUpDown, ChevronLeft, ChevronRight, Inbox } from "lucide-react";

export type DataTableProps<T> = {
  data: T[];
  columns: ColumnDef<T, any>[];
  selectable?: boolean;
  bulkBar?: (selected: T[], clear: () => void) => ReactNode;
  emptyTitle?: string;
  emptyDescription?: string;
  onRowClick?: (row: T) => void;
  pageSize?: number;
  loading?: boolean;
};

export function DataTable<T>({
  data,
  columns,
  selectable,
  bulkBar,
  emptyTitle = "No records found",
  emptyDescription = "Try adjusting your filters.",
  onRowClick,
  pageSize = 25,
  loading,
}: DataTableProps<T>) {
  const [sorting, setSorting] = useState<SortingState>([]);
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [size, setSize] = useState(pageSize);

  const selectionCol: ColumnDef<T, any>[] = selectable
    ? [
        {
          id: "__select",
          header: ({ table }) => (
            <Checkbox
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(v) => table.toggleAllPageRowsSelected(!!v)}
              aria-label="Select all"
            />
          ),
          cell: ({ row }) => (
            <Checkbox
              checked={row.getIsSelected()}
              onCheckedChange={(v) => row.toggleSelected(!!v)}
              aria-label="Select row"
              onClick={(e) => e.stopPropagation()}
            />
          ),
          enableSorting: false,
          size: 32,
        },
      ]
    : [];

  const table = useReactTable({
    data,
    columns: [...selectionCol, ...columns],
    state: { sorting, rowSelection },
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    initialState: { pagination: { pageSize: size } },
  });

  // sync size
  if (table.getState().pagination.pageSize !== size) {
    table.setPageSize(size);
  }

  const selectedRows = table.getSelectedRowModel().rows.map((r) => r.original);
  const total = data.length;
  const pageIndex = table.getState().pagination.pageIndex;
  const from = total === 0 ? 0 : pageIndex * size + 1;
  const to = Math.min((pageIndex + 1) * size, total);

  return (
    <div className="relative">
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <Table>
            <TableHeader className="sticky top-0 z-10 bg-muted/40">
              {table.getHeaderGroups().map((hg) => (
                <TableRow key={hg.id}>
                  {hg.headers.map((h) => {
                    const canSort = h.column.getCanSort();
                    return (
                      <TableHead
                        key={h.id}
                        className="text-xs font-semibold uppercase tracking-wide text-muted-foreground"
                      >
                        {h.isPlaceholder ? null : canSort ? (
                          <button
                            className="inline-flex items-center gap-1 hover:text-foreground"
                            onClick={h.column.getToggleSortingHandler()}
                          >
                            {flexRender(
                              h.column.columnDef.header,
                              h.getContext(),
                            )}
                            <ArrowUpDown className="h-3 w-3 opacity-50" />
                          </button>
                        ) : (
                          flexRender(
                            h.column.columnDef.header,
                            h.getContext(),
                          )
                        )}
                      </TableHead>
                    );
                  })}
                </TableRow>
              ))}
            </TableHeader>
            <TableBody>
              {loading ? (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="py-16 text-center text-sm text-muted-foreground"
                  >
                    Loading…
                  </TableCell>
                </TableRow>
              ) : table.getRowModel().rows.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={table.getAllColumns().length}
                    className="py-16 text-center"
                  >
                    <div className="flex flex-col items-center gap-2 text-muted-foreground">
                      <Inbox className="h-8 w-8 opacity-50" />
                      <div className="font-medium text-foreground">
                        {emptyTitle}
                      </div>
                      <div className="text-sm">{emptyDescription}</div>
                    </div>
                  </TableCell>
                </TableRow>
              ) : (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    onClick={() => onRowClick?.(row.original)}
                    className={onRowClick ? "cursor-pointer" : ""}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id} className="py-2.5">
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext(),
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </div>
        {total > 0 && (
          <div className="flex flex-wrap items-center justify-between gap-3 border-t px-4 py-2.5 text-sm">
            <div className="text-muted-foreground">
              Showing {from}–{to} of {total}
            </div>
            <div className="flex items-center gap-2">
              <Select
                value={String(size)}
                onValueChange={(v) => setSize(Number(v))}
              >
                <SelectTrigger className="h-8 w-[80px] text-xs">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {[10, 25, 50, 100].map((n) => (
                    <SelectItem key={n} value={String(n)}>
                      {n} / page
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                <ChevronLeft className="h-4 w-4" />
              </Button>
              <Button
                size="icon"
                variant="outline"
                className="h-8 w-8"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                <ChevronRight className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
      </div>

      {selectable && selectedRows.length > 0 && bulkBar && (
        <div className="sticky bottom-4 z-20 mt-3 flex justify-center">
          <div className="flex items-center gap-3 rounded-full border bg-card px-4 py-2 shadow-lg">
            <span className="text-sm font-medium">
              {selectedRows.length} selected
            </span>
            {bulkBar(selectedRows, () => setRowSelection({}))}
          </div>
        </div>
      )}
    </div>
  );
}
