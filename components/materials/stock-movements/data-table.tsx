"use client";

import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  getFacetedUniqueValues,
  useReactTable,
} from "@tanstack/react-table";

import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { UnfoldHorizontalIcon } from "lucide-react";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";

import {
  DropdownMenu, DropdownMenuCheckboxItem, DropdownMenuContent,
  DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import React, { useMemo } from "react";
import { StockMovement } from "@/lib/types";

export interface MergedStockMovement extends StockMovement {
  movementTypes: string[];
  sohDetails?: StockMovement;
  vendorDetails?: StockMovement;
}

interface DataTableProps {
  columns: ColumnDef<MergedStockMovement, unknown>[];
  data: StockMovement[];
}

export function StockMovementDataTable({ columns, data }: DataTableProps) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>([]);
  const [columnVisibility, setColumnVisibility] = React.useState<VisibilityState>({});
  const [globalFilter, setGlobalFilter] = React.useState("");

  // ⭐ FIX: Grouping pakai composite key agar vendorDetails & sohDetails tidak terpisah
  const groupedData = useMemo(() => {
    const groups: Record<string, MergedStockMovement> = {};

    data.forEach((row) => {
      // FIX KEY — konsisten & tidak bentrok microseconds
      const key = [
        new Date(row.timestamp).toISOString(),
        row.materialCode,
        row.binSequenceId?.Int64 ?? "no-bin",
        row.movementType,
      ].join("_");

      if (!groups[key]) {
        groups[key] = {
          ...row,
          movementTypes: [row.movementType],
          sohDetails: !row.movementType.toLowerCase().includes("vendor") ? row : undefined,
          vendorDetails: row.movementType.toLowerCase().includes("vendor") ? row : undefined,
        };
      } else {
        groups[key].movementTypes.push(row.movementType);

        if (!row.movementType.toLowerCase().includes("vendor")) {
          groups[key].sohDetails = row;
        } else {
          groups[key].vendorDetails = row;
        }
      }
    });

    return Object.values(groups).sort(
      (a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()
    );
  }, [data]);

  const table = useReactTable<MergedStockMovement>({
    data: groupedData,
    columns,
    state: { sorting, columnFilters, globalFilter, columnVisibility },
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <Input
          type="text"
          placeholder="Cari di semua kolom..."
          value={globalFilter ?? ""}
          onChange={(e) => setGlobalFilter(e.target.value)}
          className="max-w-sm"
        />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="hidden h-9 lg:flex">
              <UnfoldHorizontalIcon className="mr-2 h-4 w-4" /> View
            </Button>
          </DropdownMenuTrigger>

          <DropdownMenuContent align="end" className="w-[180px]">
            <DropdownMenuLabel>Toggle kolom</DropdownMenuLabel>
            <DropdownMenuSeparator />

            {table.getAllLeafColumns().filter(col => col.getCanHide()).map((col) => (
              <DropdownMenuCheckboxItem
                key={col.id}
                className="capitalize"
                checked={col.getIsVisible()}
                onCheckedChange={(value) => col.toggleVisibility(!!value)}
              >
                {col.id.replace(/([A-Z])/g, " $1").replace(/^./, (str) => str.toUpperCase())}
              </DropdownMenuCheckboxItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="rounded-md border">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead colSpan={columns.length}>
                <span className="text-sm font-light text-muted-foreground">
                  Total {table.getFilteredRowModel().rows.length} data
                </span>
              </TableHead>
            </TableRow>

            {table.getHeaderGroups().map(hg => (
              <TableRow key={hg.id}>
                {hg.headers.map(h => (
                  <TableHead key={h.id}>
                    {h.isPlaceholder ? null :
                      flexRender(h.column.columnDef.header, h.getContext())}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>

          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map(row => (
                <TableRow key={row.id} data-state={row.getIsSelected() && "selected"}>
                  {row.getVisibleCells().map(cell => (
                    <TableCell key={cell.id} className="font-light">
                      {flexRender(cell.column.columnDef.cell, cell.getContext())}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell colSpan={columns.length} className="text-center">
                  Tidak ada data histori.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>

      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
          <p className="text-sm font-light">Baris per halaman:</p>

          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => table.setPageSize(Number(value))}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue />
            </SelectTrigger>

            <SelectContent side="top">
              {[10, 15, 20, 25, 30, 50].map(size => (
                <SelectItem key={size} value={`${size}`}>{size}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-4">
          <div className="w-[100px] text-sm text-center">
            Page {table.getState().pagination.pageIndex + 1} / {table.getPageCount()}
          </div>

          <div className="flex items-center space-x-2">
            <Button
              size="sm"
              className="border text-black bg-background"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Back
            </Button>

            <Button
              size="sm"
              className="border text-black bg-background"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
