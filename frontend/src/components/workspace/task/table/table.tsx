import * as React from "react";
import {
  ColumnDef,
  ColumnFiltersState,
  SortingState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";
import TableSkeleton from "@/components/skeleton-loaders/table-skeleton";
import { DataTablePagination } from "./table-pagination";
import { TaskStatusEnum } from "@/constant";

// DataTable component with enhanced sorting functionality
// - Supports manual sorting with communication to parent component
// - Enables alphabetical sorting for text columns and proper date sorting
// - Sorting changes trigger API calls via onSortingChange callback

interface PaginationProps {
  totalCount: number;
  pageNumber: number;
  pageSize: number;
}

interface DataTableProps<TData, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
  isLoading?: boolean;
  filtersToolbar?: React.ReactNode;
  pagination?: PaginationProps;
  onPageChange?: (page: number) => void;
  onPageSizeChange?: (size: number) => void;
  onSortingChange?: (field: string | null, order: 'asc' | 'desc' | null) => void;
}

export function DataTable<TData, TValue>({
  columns,
  data,
  isLoading,
  filtersToolbar,
  pagination,
  onPageChange,
  onPageSizeChange,
  onSortingChange,
}: DataTableProps<TData, TValue>) {
  const { totalCount = 0, pageNumber = 1, pageSize = 10 } = pagination || {};

  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({});
  const [rowSelection, setRowSelection] = React.useState({});

  // Handle sorting changes and communicate to parent
  const handleSortingChange = React.useCallback((updater: any) => {
    const newSorting = typeof updater === 'function' ? updater(sorting) : updater;
    setSorting(newSorting);

    // Communicate sorting change to parent component
    if (onSortingChange && newSorting.length > 0) {
      const sortInfo = newSorting[0];
      onSortingChange(sortInfo.id, sortInfo.desc ? 'desc' : 'asc');
    } else if (onSortingChange) {
      onSortingChange(null, null);
    }
  }, [sorting, onSortingChange]);

  const table = useReactTable({
    data,
    columns,
    manualPagination: true,
    manualSorting: false, // Use client-side sorting for immediate feedback
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
      pagination: { pageIndex: pageNumber - 1, pageSize },
    },
    onSortingChange: handleSortingChange,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
  });

  return (
    <div className="w-full space-y-4">
      <div className="flex flex-col items-start gap-4 sm:flex-row sm:items-center sm:justify-between">
        {filtersToolbar && (
          <div className="w-full flex-1"> {filtersToolbar}</div>
        )}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" className="w-full sm:w-auto lg:mb-12 sm:mb-[-15px] border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 hover:bg-gray-50 dark:hover:bg-gray-700">
              Columns <ChevronDown className="ml-6 h-4 w-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 shadow-lg dark:shadow-gray-900/50">
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) =>
                      column.toggleVisibility(!!value)
                    }
                  >
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      <div className="rounded-md border border-border/50 dark:border-slate-700/50 bg-card/50 dark:bg-slate-800/90 backdrop-blur-sm overflow-x-auto">
        {isLoading ? (
          <TableSkeleton columns={6} rows={10} />
        ) : (
          <Table>
            <TableHeader>
              {table.getHeaderGroups().map((headerGroup) => (
                <TableRow key={headerGroup.id}>
                  {headerGroup.headers.map((header) => {
                    return (
                      <TableHead key={header.id}>
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
            <TableBody>
              {table.getRowModel().rows?.length ? (
                table.getRowModel().rows.map((row) => (
                  <TableRow
                    key={row.id}
                    data-state={row.getIsSelected() && "selected"}
                    className={`transition-all duration-200 ${(row.original as any).status === TaskStatusEnum.DONE
                      ? 'border-l-4 border-l-blue-500 bg-blue-50/80 hover:bg-blue-100/80 dark:bg-blue-950/30 dark:hover:bg-blue-950/50 dark:border-l-blue-400 shadow-sm dark:shadow-blue-900/20'
                      : 'hover:bg-slate-50 dark:hover:bg-slate-800/60'
                      }`}
                  >
                    {row.getVisibleCells().map((cell) => (
                      <TableCell key={cell.id}>
                        {flexRender(
                          cell.column.columnDef.cell,
                          cell.getContext()
                        )}
                      </TableCell>
                    ))}
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell
                    colSpan={columns.length}
                    className="h-24 text-center text-muted-foreground"
                  >
                    No results.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        )}
      </div>
      <DataTablePagination
        table={table}
        pageNumber={pageNumber}
        pageSize={pageSize}
        totalCount={totalCount}
        onPageChange={onPageChange}
        onPageSizeChange={onPageSizeChange}
      />
    </div>
  );
}
