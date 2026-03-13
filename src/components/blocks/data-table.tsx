import * as React from "react"
import {
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  type ColumnDef,
  type ColumnFiltersState,
  type SortingState,
  type VisibilityState,
} from "@tanstack/react-table"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { ChevronDown, Filter, Search } from "lucide-react"
import { ICON_STROKE_WIDTH } from "@/lib/constants"

export interface DataTableFilter {
  key: string
  label: string
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

interface DataTableProps<TData> {
  data: TData[]
  columns: ColumnDef<TData>[]
  searchPlaceholder?: string
  searchColumn?: string
  filters?: DataTableFilter[]
  actions?: React.ReactNode
  enableSelection?: boolean
  enableColumnVisibility?: boolean
  enablePagination?: boolean
  pageSizeOptions?: number[]
  emptyMessage?: string
  isLoading?: boolean
  onRowSelectionChange?: (selectedRows: TData[]) => void
}

/**
 * DataTable Block
 * 
 * A comprehensive data table component with search, filters, pagination,
 * column visibility, and row selection capabilities.
 * 
 * @example
 * ```tsx
 * <DataTable
 *   data={customers}
 *   columns={columns}
 *   searchPlaceholder="Search customers..."
 *   searchColumn="email"
 *   filters={[
 *     {
 *       key: "status",
 *       label: "Status",
 *       options: [
 *         { value: "all", label: "All Status" },
 *         { value: "active", label: "Active" },
 *         { value: "inactive", label: "Inactive" }
 *       ]
 *     }
 *   ]}
 *   actions={<Button>Add Customer</Button>}
 * />
 * ```
 */
export function DataTable<TData>({
  data,
  columns,
  searchPlaceholder = "Search...",
  searchColumn,
  filters = [],
  actions,
  enableSelection = true,
  enableColumnVisibility = true,
  enablePagination = true,
  pageSizeOptions = [10, 20, 30, 40, 50],
  emptyMessage = "No results.",
  isLoading = false,
  onRowSelectionChange,
}: DataTableProps<TData>) {
  const [sorting, setSorting] = React.useState<SortingState>([])
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([])
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({})
  const [rowSelection, setRowSelection] = React.useState({})
  const [filterValues, setFilterValues] = React.useState<Record<string, string[]>>({})

  const table = useReactTable({
    data,
    columns,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: enablePagination ? getPaginationRowModel() : undefined,
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    onColumnVisibilityChange: setColumnVisibility,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: enableSelection,
    state: {
      sorting,
      columnFilters,
      columnVisibility,
      rowSelection,
    },
  })

  // Determine search column - use provided or first text column
  const searchColumnKey = React.useMemo(() => {
    if (searchColumn) return searchColumn
    // Find first column that's likely a text/searchable column
    const firstColumn = columns.find((col) => {
      const id = typeof col.id === "string" ? col.id : undefined
      return id && !id.includes("select") && !id.includes("actions")
    })
    return typeof firstColumn?.id === "string" ? firstColumn.id : undefined
  }, [searchColumn, columns])

  // Handle filter changes
  React.useEffect(() => {
    filters.forEach((filter) => {
      const column = table.getColumn(filter.key)
      if (column) {
        const filterValue = filterValues[filter.key]
        if (filterValue && filterValue.length > 0 && filterValue[0] !== "all") {
          column.setFilterValue(filterValue)
        } else {
          column.setFilterValue(undefined)
        }
      }
    })
  }, [filterValues, filters, table])

  // Notify parent of row selection changes
  React.useEffect(() => {
    if (onRowSelectionChange) {
      const selectedRows = table.getFilteredSelectedRowModel().rows.map((row) => row.original)
      onRowSelectionChange(selectedRows)
    }
  }, [rowSelection, table, onRowSelectionChange])

  const handleFilterChange = (filterKey: string, value: string) => {
    setFilterValues((prev) => ({
      ...prev,
      [filterKey]: value === "all" ? [] : [value],
    }))
  }

  return (
    <div className="space-y-4">
      {/* Filters and Search */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-1 items-center gap-2">
          {searchColumnKey && (
            <div className="relative" style={{ width: "240px" }}>
              <Search
                strokeWidth={ICON_STROKE_WIDTH}
                className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground pointer-events-none"
              />
              <Input
                placeholder={searchPlaceholder}
                value={(table.getColumn(searchColumnKey)?.getFilterValue() as string) ?? ""}
                onChange={(event) =>
                  table.getColumn(searchColumnKey)?.setFilterValue(event.target.value)
                }
                className="pl-9 w-full"
              />
            </div>
          )}
          {filters.map((filter) => {
            const currentValue =
              filterValues[filter.key]?.length > 0 ? filterValues[filter.key][0] : "all"
            return (
              <Select
                key={filter.key}
                value={currentValue}
                onValueChange={(value) => handleFilterChange(filter.key, value)}
              >
                <SelectTrigger className="w-[140px]">
                  {filter.key === filters[0]?.key && (
                    <Filter className="mr-2 h-4 w-4" />
                  )}
                  <SelectValue placeholder={filter.placeholder || filter.label} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All {filter.label}</SelectItem>
                  {filter.options.map((option) => (
                    <SelectItem key={option.value} value={option.value}>
                      {option.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            )
          })}
        </div>
        <div className="flex items-center gap-2">
          {actions}
          {enableColumnVisibility && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline">
                  Columns <ChevronDown className="ml-2 h-4 w-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(!!value)}
                      >
                        {column.id}
                      </DropdownMenuCheckboxItem>
                    )
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>

      {/* Table */}
      <div className="overflow-hidden rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => {
                  return (
                    <TableHead key={header.id}>
                      {header.isPlaceholder
                        ? null
                        : flexRender(header.column.columnDef.header, header.getContext())}
                    </TableHead>
                  )
                })}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {isLoading ? (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center"
                >
                  Loading...
                </TableCell>
              </TableRow>
            ) : table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell key={cell.id}>
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="h-24 text-center">
                  {emptyMessage}
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination and Selection Info */}
      {enablePagination && (
        <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
          {enableSelection && (
            <div className="text-sm text-muted-foreground">
              {table.getFilteredSelectedRowModel().rows.length} of{" "}
              {table.getFilteredRowModel().rows.length} row(s) selected.
            </div>
          )}
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-2 text-sm">
              <span>Rows per page</span>
              <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => {
                  table.setPageSize(Number(value))
                }}
              >
                <SelectTrigger className="h-8 w-[70px]">
                  <SelectValue placeholder={table.getState().pagination.pageSize} />
                </SelectTrigger>
                <SelectContent side="top">
                  {pageSizeOptions.map((pageSize) => (
                    <SelectItem key={pageSize} value={`${pageSize}`}>
                      {pageSize}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2 text-sm font-medium">
              Page {table.getState().pagination.pageIndex + 1} of{" "}
              {table.getPageCount()}
            </div>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.previousPage()}
                disabled={!table.getCanPreviousPage()}
              >
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => table.nextPage()}
                disabled={!table.getCanNextPage()}
              >
                Next
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

