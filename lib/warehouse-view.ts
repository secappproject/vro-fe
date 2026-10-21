"use client";

// Pilihan tampilan gudang untuk role internal (Superuser/Admin/Viewer):
// "sec" = material di gudang SEC, "supermarket" = material di gudang subcontractor.
// Disimpan bersama (dan di sessionStorage) supaya Rpl. Stock Monitoring dan kedua
// Dashboard Summary menampilkan gudang yang sama saat user berpindah halaman.

import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";
import { isSupermarketMaterial } from "@/lib/roles";

export type WarehouseView = "sec" | "supermarket";

interface WarehouseViewState {
  view: WarehouseView;
  setView: (view: WarehouseView) => void;
}

export const useWarehouseView = create<WarehouseViewState>()(
  persist(
    (set) => ({
      view: "sec",
      setView: (view) => set({ view }),
    }),
    {
      name: "warehouse-view",
      storage: createJSONStorage(() => sessionStorage),
    }
  )
);

/** Material yang termasuk gudang yang sedang dipilih. */
export const filterByWarehouse = <T extends { vendorType?: string | null }>(
  items: T[],
  view: WarehouseView
): T[] => items.filter((m) => isSupermarketMaterial(m) === (view === "supermarket"));
