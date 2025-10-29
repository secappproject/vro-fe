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
    enableColumnFilter: true,
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
    enableColumnFilter: true,
  },
  {
    id: "currentQuantity",
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
    enableSorting: false,
    enableColumnFilter: true,
    enableHiding: false,
  },
  {
    id: "remark",
    accessorFn: (row) => {
      const { currentQuantity = 0, maxBinQty, minBinQty, packQuantity } = row;

      if (packQuantity <= 0 || maxBinQty <= 0) {
        return "N/A";
      }

      const reorderPoint = Math.max(minBinQty, packQuantity);
      const halfMaxQty = maxBinQty / 2;
      const current = currentQuantity;

      if (current <= reorderPoint) {
        return "shortage";
      } else if (current > reorderPoint && current <= halfMaxQty) {
        return "preshortage";
      } else {
        return "ok";
      }
    },
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Remark" />
    ),
    cell: ({ row }) => {
      const remark = row.getValue("remark") as string;

      let colorClass = "";
      switch (remark) {
        case "shortage":
          colorClass = "text-red-600 font-medium";
          break;
        case "preshortage":
          colorClass = "text-yellow-600 font-medium";
          break;
        case "ok":
          colorClass = "text-green-600 font-medium";
          break;
        default:
          colorClass = "text-gray-500";
      }
      return <span className={colorClass}>{remark}</span>;
    },
    enableColumnFilter: true,
    enableSorting: true,
  },
  {
    accessorKey: "vendorCode",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor" />
    ),
    enableColumnFilter: true,
  },
  {
    accessorKey: "lokasi",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Lokasi" />
    ),
    enableColumnFilter: true,
  },
  // --- KOLOM PIC DITAMBAHKAN DI SINI ---
  {
    accessorKey: "pic",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PIC" />
    ),
    enableColumnFilter: true,
    enableHiding: true, // Default-nya di-hide, bisa dibuka di 'View'
  },
  // --- AKHIR KOLOM PIC ---
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
  {
    accessorKey: "minBinQty",
    id: "minBinQty",
    enableColumnFilter: true,
    enableHiding: true,
  },
  {
    accessorKey: "packQuantity",
    id: "packQuantity",
    enableColumnFilter: true,
    enableHiding: true,
  },
  {
    accessorKey: "maxBinQty",
    id: "maxBinQty",
    enableColumnFilter: true,
    enableHiding: true,
  },
  {
    id: "totalBins",
    accessorFn: (row) =>
      row.packQuantity > 0 ? Math.ceil(row.maxBinQty / row.packQuantity) : 0,
    enableColumnFilter: true,
    enableHiding: true,
  },
];