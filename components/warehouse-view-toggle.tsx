"use client";

import { filterByWarehouse, useWarehouseView, type WarehouseView } from "@/lib/warehouse-view";

const OPTIONS: ReadonlyArray<[WarehouseView, string]> = [
  ["sec", "WHS SEC"],
  ["supermarket", "Supermarket"],
];

/**
 * Tombol "WHS SEC | Supermarket" untuk role internal. Kalau `materials` diberikan,
 * jumlah material per gudang ikut ditampilkan.
 */
export function WarehouseViewToggle({
  materials,
  className = "",
}: {
  materials?: { vendorType?: string | null }[];
  className?: string;
}) {
  const { view, setView } = useWarehouseView();

  return (
    <div
      className={`inline-flex gap-1 rounded-lg bg-gray-100 p-1 ${className}`}
      role="tablist"
      aria-label="Pilih gudang"
    >
      {OPTIONS.map(([value, label]) => (
        <button
          key={value}
          type="button"
          role="tab"
          aria-selected={view === value}
          onClick={() => setView(value)}
          className={`rounded-md px-3 py-1 text-xs font-medium ${
            view === value ? "bg-[#008A15] text-white" : "text-gray-600 hover:text-gray-900"
          }`}
        >
          {label}
          {materials && ` (${filterByWarehouse(materials, value).length})`}
        </button>
      ))}
    </div>
  );
}
