"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Vendor } from "@/lib/types";
import { DataTableColumnHeader } from "../reusable-datatable/column-header";
import { VendorDataTableRowActions } from "./row-actions";

type VendorUpdateHandler = (updatedVendor: Vendor) => void;
type VendorDeleteHandler = (vendorId: number) => void;

export const getVendorColumns = (
  onVendorUpdated: VendorUpdateHandler,
  onVendorDeleted: VendorDeleteHandler
): ColumnDef<Vendor>[] => [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Perusahaan" />
    ),
    cell: ({ row }) => {
      return <span>{row.getValue("companyName")}</span>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "vendorType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipe Vendor" />
    ),
    cell: ({ row }) => {
      return <span>{row.getValue("vendorType")}</span>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <VendorDataTableRowActions
        vendor={row.original}
        onVendorUpdated={onVendorUpdated}
        onVendorDeleted={onVendorDeleted}
      />
    ),
  },
];