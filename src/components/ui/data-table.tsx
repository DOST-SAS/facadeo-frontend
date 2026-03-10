
import {
  flexRender,
  getCoreRowModel,
  getPaginationRowModel,
  useReactTable,
  type ColumnDef,
} from "@tanstack/react-table";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "./button";
import { Loader2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  pageCount?: number;
  pageIndex?: number;
  pageSize?: number;
  onPageChange?: (pageIndex: number) => void;
  onPageSizeChange?: (pageSize: number) => void;
  manualPagination?: boolean;
  loading?: boolean;
  updatingRowId?: string | number | null;
  getRowId?: (row: TData) => string;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  pageCount,
  pageIndex = 0,
  pageSize = 10,
  onPageChange,
  onPageSizeChange,
  manualPagination = false,
  loading = false,
  updatingRowId,
  getRowId,
}: DataTableProps<TData, TValue>) {
  const table = useReactTable({
    data,
    columns,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    manualPagination,
    getRowId,
    pageCount: manualPagination ? pageCount : undefined,
    state: manualPagination
      ? {
        pagination: {
          pageIndex,
          pageSize,
        },
      }
      : undefined,
    onPaginationChange: manualPagination
      ? (updater) => {
        const newState =
          typeof updater === "function"
            ? updater({ pageIndex, pageSize })
            : updater;
        if (newState.pageIndex !== pageIndex && onPageChange) {
          onPageChange(newState.pageIndex);
        }
        if (newState.pageSize !== pageSize && onPageSizeChange) {
          onPageSizeChange(newState.pageSize);
        }
      }
      : undefined,
    initialState: !manualPagination
      ? {
        pagination: {
          pageSize: 10,
        },
      }
      : undefined,
  });

  return (
    <div className="space-y-2 bg-card p-4 rounded-sm shadow-sm">
      <div className="overflow-hidden rounded-sm border border-border">
        <Table className="bg-card">
          <TableHeader className="bg-gray-50 dark:bg-gray-800">
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead
                      key={header.id}
                      className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                    >
                      {header.isPlaceholder
                        ? null
                        : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                    </TableHead>
                  );
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody className="bg-card divide-y divide-gray-200 dark:divide-gray-800">
            {loading ? (
              Array.from({ length: pageSize }).map((_, i) => (
                <TableRow key={i}>
                  {columns.map((_, j) => (
                    <TableCell key={j} className="p-4">
                      <div className="h-6 w-full animate-pulse rounded bg-muted" />
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => {
                const isUpdating = updatingRowId != null && String(row.id) === String(updatingRowId);
                return (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={cn(
                      "hover:bg-gray-50 dark:hover:bg-secondary/50 relative",
                      isUpdating && "opacity-60 pointer-events-none"
                    )}
                  >
                    {isUpdating && (
                      <TableCell colSpan={columns.length} className="absolute inset-0 z-20 p-0">
                        <div className="absolute inset-0 bg-background/60 backdrop-blur-[2px] overflow-hidden border border-primary/20">
                          <div className="absolute inset-0 bg-linear-to-r from-transparent via-white/20 to-transparent -translate-x-full animate-[shimmer_2s_infinite]" />
                          <div className="absolute inset-0 flex items-center justify-center">
                            <div className="bg-card px-3 py-1 rounded-full shadow-lg border border-primary/10 flex items-center gap-2 scale-90">
                              <Loader2 className="w-4 h-4 animate-spin text-primary" />
                              <span className="text-[10px] font-semibold text-primary animate-pulse whitespace-nowrap">Mise à jour...</span>
                            </div>
                          </div>
                        </div>
                      </TableCell>
                    )}
                    {row.getVisibleCells().map((cell) => (
                      <TableCell
                        key={cell.id}
                        className="p-4 whitespace-nowrap"
                      >
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                );
              })
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns?.length}
                  className="h-24 text-center text-gray-500"
                >
                  Aucun résultat trouvé.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination */}
      <div className="flex items-center justify-between px-6 py-2">
        <span className="text-sm text-muted-foreground font-mono">
          Page {table.getState().pagination.pageIndex + 1} sur {table.getPageCount()}
        </span>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition-all"
            onClick={() => table.previousPage()}
            disabled={!table.getCanPreviousPage()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="15 18 9 12 15 6"></polyline>
            </svg>
          </Button>

          {(() => {
            const currentPage = table.getState().pagination.pageIndex;
            const totalPages = table.getPageCount();
            const pages: (number | string)[] = [];

            if (totalPages <= 7) {
              // Show all pages if 7 or fewer
              for (let i = 0; i < totalPages; i++) {
                pages.push(i);
              }
            } else {
              // Always show first page
              pages.push(0);

              if (currentPage <= 3) {
                // Near the start
                for (let i = 1; i <= 4; i++) {
                  pages.push(i);
                }
                pages.push("ellipsis");
                pages.push(totalPages - 1);
              } else if (currentPage >= totalPages - 4) {
                // Near the end
                pages.push("ellipsis");
                for (let i = totalPages - 5; i < totalPages - 1; i++) {
                  pages.push(i);
                }
                pages.push(totalPages - 1);
              } else {
                // In the middle
                pages.push("ellipsis");
                for (let i = currentPage - 1; i <= currentPage + 1; i++) {
                  pages.push(i);
                }
                pages.push("ellipsis");
                pages.push(totalPages - 1);
              }
            }

            return pages.map((page, index) => {
              if (page === "ellipsis") {
                return (
                  <span
                    key={`ellipsis-${index}`}
                    className="px-2 text-muted-foreground"
                  >
                    ...
                  </span>
                );
              }

              const pageNum = page as number;
              return (
                <Button
                  key={pageNum}
                  variant="outline"
                  size="icon"
                  className={`h-9 w-9 rounded-lg border-border transition-all ${currentPage === pageNum
                    ? "bg-primary/10 border-primary/40 text-primary"
                    : "bg-card hover:bg-primary/5 hover:border-primary/40"
                    }`}
                  onClick={() => table.setPageIndex(pageNum)}
                >
                  {pageNum + 1}
                </Button>
              );
            });
          })()}

          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9 rounded-lg border-border bg-card hover:bg-primary/5 hover:border-primary/40 transition-all"
            onClick={() => table.nextPage()}
            disabled={!table.getCanNextPage()}
          >
            <svg
              xmlns="http://www.w3.org/2000/svg"
              width="16"
              height="16"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            >
              <polyline points="9 18 15 12 9 6"></polyline>
            </svg>
          </Button>
        </div>
      </div>
    </div>
  );
}