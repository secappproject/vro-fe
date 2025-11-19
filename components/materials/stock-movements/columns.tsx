"use client";

import { ColumnDef } from "@tanstack/react-table";
import {
  StockMovement,
  GoSqlNullInt,
  GoSqlNullString,
} from "@/lib/types";
import { ArrowRight } from "lucide-react";
import { DataTableColumnHeader } from "@/components/reusable-datatable/column-header";
import { Row } from "@tanstack/react-table";

const customFilterFn = (
  row: Row<StockMovement>,
  columnId: string,
  filterValue: string[]
) => {
  if (!filterValue || filterValue.length === 0) {
    return true;
  }

  const rowValue = row.getValue(columnId);
  let rowDisplayValue = "(Kosong)";

  if (typeof rowValue === 'object' && rowValue !== null && 'Valid' in rowValue) {
    if ((rowValue as GoSqlNullInt).Valid && "Int64" in rowValue) {
      rowDisplayValue = `Bin ${(rowValue as GoSqlNullInt).Int64}`;
    } else if ((rowValue as GoSqlNullString).Valid && "String" in rowValue) {
      rowDisplayValue = (rowValue as GoSqlNullString).String;
    }
  } 
  else if (typeof rowValue === 'string') {
    const date = new Date(rowValue);
    if (!isNaN(date.getTime()) && rowValue.includes('T') && rowValue.includes('Z')) {
      rowDisplayValue = date.toLocaleDateString("id-ID", {
        day: "2-digit",
        month: "short",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      });
    } else {
      rowDisplayValue = rowValue;
    }
  }

  if (rowDisplayValue === "(Kosong)" && filterValue.includes("(Kosong)")) {
    return true;
  }

  return filterValue.includes(rowDisplayValue);
};

export const getStockMovementColumns = (): ColumnDef<StockMovement>[] => [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "timestamp",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Waktu" />
    ),
    cell: ({ row }) => {
      const date = new Date(row.getValue("timestamp"));
      return (
        <div className="flex flex-col">
          <span className="text-sm">
            {date.toLocaleDateString("id-ID", {
              day: "2-digit",
              month: "short",
              year: "numeric",
            })}
          </span>
          <span className="text-xs text-muted-foreground">
            {date.toLocaleTimeString("id-ID", {
              hour: "2-digit",
              minute: "2-digit",
              second: "2-digit",
            })}
          </span>
        </div>
      );
    },
    enableColumnFilter: true,
    filterFn: customFilterFn,
  },
  {
    accessorKey: "movementType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipe Aksi" />
    ),
    cell: ({ row }) => {
      const type = row.getValue("movementType") as string;
      
      const displayType = type.replace(" Vendor", "");

      let colorClass = "";
      if (type.includes("IN")) {
        colorClass = "text-green-600";
      } else if (type.includes("OUT")) {
        colorClass = "text-red-600";
      } else if (type.includes("Edit")) { 
        colorClass = "text-black-600";
      }
      return <span className={`font-medium ${colorClass}`}>{displayType}</span>;
    },
    enableColumnFilter: true,
    filterFn: customFilterFn,
  },
  {
    id: "sohChange",
    header: "Perubahan SOH",
    cell: ({ row }) => {
      const { movementType, oldQuantity, newQuantity, quantityChange } = row.original;

      if (movementType.includes("Vendor")) {
        return <span className="text-muted-foreground">-</span>;
      }

      const isPositive = quantityChange > 0;
      return (
        <div className="flex items-center space-x-2 font-mono">
          <span>{oldQuantity}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-bold">{newQuantity}</span>
          <span
            className={`font-bold text-sm ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            ({isPositive ? `+${quantityChange}` : quantityChange})
          </span>
        </div>
      );
    },
  },
  {
    id: "vendorStockChange",
    header: "Perubahan Vendor Stok",
    cell: ({ row }) => {
      const { movementType, oldQuantity, newQuantity, quantityChange } = row.original;

      if (!movementType.includes("Vendor")) {
        return <span className="text-muted-foreground">-</span>;
      }

      const isPositive = quantityChange > 0;
      return (
        <div className="flex items-center space-x-2 font-mono">
          <span>{oldQuantity}</span>
          <ArrowRight className="h-4 w-4 text-muted-foreground" />
          <span className="font-bold">{newQuantity}</span>
          <span
            className={`font-bold text-sm ${
              isPositive ? "text-green-600" : "text-red-600"
            }`}
          >
            ({isPositive ? `+${quantityChange}` : quantityChange})
          </span>
        </div>
      );
    },
  },
  {
    accessorKey: "binSequenceId",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Bin" />
    ),
    cell: ({ row }) => {
      const binIdObject = row.getValue("binSequenceId") as GoSqlNullInt;

      if (binIdObject && binIdObject.Valid) {
        return <span className="font-mono">Bin {binIdObject.Int64}</span>;
      }
      return <span className="text-muted-foreground">-</span>;
    },
    enableColumnFilter: true,
    filterFn: customFilterFn,
  },
  {
    accessorKey: "pic",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PIC" />
    ),
    enableColumnFilter: true,
    filterFn: customFilterFn,
  },
  {
    accessorKey: "notes",
    header: "Notes",
    cell: ({ row }) => {
      const notesObject = row.getValue("notes") as GoSqlNullString;

      if (notesObject && notesObject.Valid) {
        return <span>{notesObject.String}</span>;
      }
      return <span className="text-muted-foreground">-</span>;
    },
    enableColumnFilter: true,
    filterFn: customFilterFn,
  },
];