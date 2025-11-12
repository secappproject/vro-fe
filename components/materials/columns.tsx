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
    accessorKey: "productType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipe" />
    ),
    enableColumnFilter: true,
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
    accessorKey: "currentQuantity",
    id: "soh",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="SoH" />
    ),
    cell: ({ row }) => {
      return <span>{row.getValue("soh")}</span>;
    },
    enableSorting: true,
    enableColumnFilter: true,
    enableHiding: false,
  },
  {
    id: "currentQuantity", 
    accessorFn: (row) => row.currentQuantity,
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Stok Bin" />
    ),
    cell: ({ row }) => {
      return <BinPreview material={row.original as Material} />;
    },
    enableSorting: false,
    enableColumnFilter: true,
    enableHiding: false,
  },
  {
    id: "replenishment",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Replenishment" />
    ),
    // --- LOGIKA REPLENISHMENT DIPERBARUI ---
    accessorFn: (row) => {
      const {
        productType,
        currentQuantity,
        maxBinQty,
        packQuantity,
        bins,
      } = row;

      if (productType === "kanban") {
        if (packQuantity <= 0 || maxBinQty <= 0) return null;
        const totalBins = Math.ceil(maxBinQty / packQuantity);
        // Hitung berapa bin yang "tersentuh" (memiliki stok > 0)
        const occupiedBins = Math.ceil(currentQuantity / packQuantity);
        return totalBins - occupiedBins;
      } 
      
      // Consumable or Option
      if (!bins) {
         // Jika material baru/belum ada data bin, anggap 0
         return 0; 
      }
      
      // Hitung bin yang stoknya 0
      const emptyBins = bins.filter(bin => bin.currentBinStock === 0).length;
      return emptyBins;
    },
    // -------------------------------------
    cell: ({ row }) => {
      const value = row.getValue("replenishment");

      if (typeof value !== "number") {
        return <span className="text-muted-foreground">-</span>;
      }

      return <span className="font-medium">{value} bin</span>;
    },
    enableSorting: true,
  },
  {
    id: "remark",
    accessorFn: (row) => {
      const { currentQuantity = 0, maxBinQty, packQuantity } = row;

      if (packQuantity <= 0 || maxBinQty <= 0) {
        return "N/A";
      }

      const current = currentQuantity;
      const shortagePoint = Math.ceil(maxBinQty * 0.3);
      const preshortagePoint = Math.ceil(maxBinQty * 0.6);

      if (current <= shortagePoint) {
        return "shortage";
      } else if (current > shortagePoint && current <= preshortagePoint) {
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
  {
    accessorKey: "vendorStock",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Vendor Stock" />
    ),
    // --- LOGIKA VENDOR STOCK DIPERBARUI (Mengacu pada Replenishment) ---
    cell: ({ row }) => {
      const stock = (row.getValue("vendorStock") as number | null) ?? 0;
      
      // --- 1. Ambil data untuk kalkulasi ---
      const { productType, maxBinQty, packQuantity, bins, currentQuantity } = row.original;

      // --- 2. Hitung Total Bins ---
      let totalBins = 0;
      if (productType === "kanban") {
          if (packQuantity > 0) totalBins = Math.ceil(maxBinQty / packQuantity);
      } else if (bins) {
          totalBins = bins.length;
      }

      // --- 3. Hitung Replenishment (Bin Kosong) ---
      let replenishment: number | null = null;
      if (productType === "kanban") {
        if (packQuantity <= 0 || maxBinQty <= 0) {
          replenishment = null;
        } else {
          const occupiedBins = Math.ceil(currentQuantity / packQuantity);
          replenishment = totalBins - occupiedBins;
        }
      } else {
        if (!bins) {
          replenishment = 0; 
        } else {
          replenishment = bins.filter(bin => bin.currentBinStock === 0).length;
        }
      }

      // --- 4. Terapkan Logika Pewarnaan ---
      let colorClass = "";
      if (replenishment !== null && totalBins > 0) {
        const halfTotal = totalBins * 0.5;

        if (replenishment <= 1) {
          // 0 atau 1 bin kosong
          colorClass = "text-red-600 font-medium"; // Merah
        } else if (replenishment > halfTotal) {
          // > 50% bin kosong
          colorClass = "text-green-600 font-medium"; // Ijo
        } else {
          // Antara 2 s/d 50% bin kosong
          colorClass = "text-yellow-600 font-medium"; // Oren
        }
      }

      return <span className={colorClass}>{stock}</span>;
    },
    // ------------------------------------
    enableSorting: true,
  },
  {
    accessorKey: "pic",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="PIC" />
    ),
    enableColumnFilter: true,
    enableHiding: true,
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