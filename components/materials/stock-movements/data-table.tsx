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
import { StockMovement, GoSqlNullInt } from "@/lib/types";


export interface MergedStockMovement extends StockMovement {
  movementTypes: string[];
  sohDetails?: StockMovement;
  vendorDetails?: StockMovement;
  relatedBins: number[]; 
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

  const groupedData = useMemo(() => {
    const groups: Record<string, MergedStockMovement> = {};

    data.forEach((row) => {
      
      const key = [
        new Date(row.timestamp).toISOString(),
        row.materialCode,
      ].join("_");

      const isVendorAction = row.movementType.toLowerCase().includes("vendor");
      
      
      let currentBinNum: number | null = null;
      if (row.binSequenceId && row.binSequenceId.Valid) {
        currentBinNum = row.binSequenceId.Int64;
      }

      if (!groups[key]) {
        
        groups[key] = {
          ...row,
          movementTypes: [row.movementType],
          sohDetails: !isVendorAction ? row : undefined,
          vendorDetails: isVendorAction ? row : undefined,
          relatedBins: currentBinNum ? [currentBinNum] : [], 
        };
      } else {
        
        const group = groups[key];

        
        if (!group.movementTypes.includes(row.movementType)) {
          group.movementTypes.push(row.movementType);
        }

        
        if (currentBinNum && !group.relatedBins.includes(currentBinNum)) {
          group.relatedBins.push(currentBinNum);
          group.relatedBins.sort((a, b) => a - b); 
        }

        
        if (isVendorAction) {
          
          
          
          group.vendorDetails = row;
        } else {
          
          if (group.sohDetails) {
             
             
             const mergedChange = group.sohDetails.quantityChange + row.quantityChange;
             
             
             
             group.sohDetails = {
                 ...row,
                 quantityChange: mergedChange,
                 oldQuantity: group.sohDetails.oldQuantity, 
                 newQuantity: row.newQuantity 
             };
          } else {
             group.sohDetails = row;
          }
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
      
      {}
      <div className="flex items-center justify-between py-4">
        <div className="flex items-center space-x-2">
            <p className="text-sm font-light">Baris per halaman:</p>
            <Select
                value={`${table.getState().pagination.pageSize}`}
                onValueChange={(value) => table.setPageSize(Number(value))}
            >
                <SelectTrigger className="h-8 w-[70px]"><SelectValue /></SelectTrigger>
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
                <Button size="sm" className="border text-black bg-background" onClick={() => table.previousPage()} disabled={!table.getCanPreviousPage()}>Back</Button>
                <Button size="sm" className="border text-black bg-background" onClick={() => table.nextPage()} disabled={!table.getCanNextPage()}>Next</Button>
            </div>
        </div>
      </div>
    </div>
  );
}