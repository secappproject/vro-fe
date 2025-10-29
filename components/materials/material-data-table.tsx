"use client";

import * as React from "react";
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
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
import { Material } from "@/lib/types"; // Diubah
import { Input } from "@/components/ui/input";
import { X } from "lucide-react";

interface DataTableProps<TData extends Material, TValue> { // Diubah
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function MaterialDataTable<TData extends Material, TValue>({ // Diubah
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );
  const [globalFilter, setGlobalFilter] = React.useState("");
  const [inputValue, setInputValue] = React.useState("");
  const [filterChips, setFilterChips] = React.useState<string[]>([]);

  const multiWordFilterFn: FilterFn<TData> = (row, _columnId, filterValue) => {
    const filterWords = String(filterValue).toLowerCase().split(" ").filter(Boolean);
    if (filterWords.length === 0) return true;

    const rowText = row
      .getVisibleCells()
      .map((cell) => String(cell.getValue() ?? ""))
      .join(" ")
      .toLowerCase();

    return filterWords.every((word) => rowText.includes(word));
  };

  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
    },
    filterFns: {
      multiWord: multiWordFilterFn,
    },
    globalFilterFn: multiWordFilterFn,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  React.useEffect(() => {
    const chipsString = filterChips.join(" ");
    const liveInputString = inputValue.trim().toLowerCase();
    const combinedFilter = [chipsString, liveInputString]
      .filter(Boolean)
      .join(" ");
    table.setGlobalFilter(combinedFilter);
  }, [filterChips, inputValue, table]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const newChip = inputValue.trim().toLowerCase();

    if (event.key === "Enter" && newChip !== "") {
      event.preventDefault();
      if (!filterChips.includes(newChip)) {
        setFilterChips((prev) => [...prev, newChip]);
      }
      setInputValue("");
    }
  };

  const removeChip = (chipToRemove: string) => {
    setFilterChips((prev) => prev.filter((chip) => chip !== chipToRemove));
  };

  const isFiltered =
    filterChips.length > 0 || table.getState().columnFilters.length > 0;

  const resetFilters = () => {
    table.resetColumnFilters();
    setFilterChips([]);
    setInputValue("");
    table.setGlobalFilter(undefined);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2 w-full max-w-lg">
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={
                filterChips.length === 0
                  ? "Cari, lalu tekan Enter..."
                  : "Tambah filter..."
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow"
            />
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="h-9 px-2 lg:px-3"
              >
                Reset <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          {filterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {filterChips.map((chip) => (
                <div
                  key={chip}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-sm"
                >
                  <span>{chip}</span>
                  <button
                    onClick={() => removeChip(chip)}
                    className="rounded-full hover:bg-muted/50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="font-light" key={cell.id}>
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
                  className="h-24 text-center font-light"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-end space-x-2">
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
  );
}
