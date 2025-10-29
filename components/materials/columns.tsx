"use client";

import { ColumnDef } from "@tanstack/react-table";
import { Material } from "@/lib/types";
import { DataTableColumnHeader } from "../reusable-datatable/column-header";
import { MaterialDataTableRowActions } from "./row-actions";
import { BinPreview } from "./bin-preview"; 

type MaterialUpdateHandler = (updatedMaterial: Material) => void;
type MaterialDeleteHandler = (materialId: number) => void;

export const getMaterialColumns = (
  onMaterialUpdated: MaterialUpdateHandler,
  onMaterialDeleted: MaterialDeleteHandler
): ColumnDef<Material>[] => [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "material",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Kode Material" />
    ),
  },
  {
    accessorKey: "materialDescription",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Deskripsi" />
    ),
    cell: ({ row }) => (
      <span className="max-w-[300px] truncate block">
        {row.getValue("materialDescription")}
      </span>
    ),
  },
  {
    id: "binStatus",
    accessorFn: (row) => row.currentQuantity,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stok Bin" />
    ),
    cell: ({ row }) => {
      const { currentQuantity, maxBinQty, minBinQty, packQuantity } =
        row.original as Material;
      return (
        <BinPreview
          currentQuantity={currentQuantity}
          maxBinQty={maxBinQty}
          minBinQty={minBinQty}
          packQuantity={packQuantity}
        />
      );
    },
  },
  {
    accessorKey: "vendorCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor" />
    ),
  },
  {
    accessorKey: "lokasi",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lokasi" />
    ),
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <MaterialDataTableRowActions
        material={row.original}
        onMaterialUpdated={onMaterialUpdated}
        onMaterialDeleted={onMaterialDeleted}
      />
    ),
  },
];