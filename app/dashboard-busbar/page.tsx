"use client";

import React, { useState, useEffect, useMemo } from "react";
import { useAuthStore } from "@/lib/types";
import { isBusbarRole, visibleBusbarTiers, type BusbarTier } from "@/lib/roles";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Cell,
} from "recharts";

// Tipe data material yang dipakai dashboard ini
interface BusbarMaterial {
  material: string;
  materialDescription?: string;
  vendorCode: string;
  vendorStock?: number;
  openPO?: number;
  productType?: string;
}

interface BusbarVendor {
  companyName: string;
  tier: "T1" | "T2";
}

// Warna per tier
const TIER_COLORS = {
  T1: "#008A15", // hijau Schneider
  T2: "#2563eb", // biru
};

export default function DashboardBusbarPage() {
  const { role, companyName } = useAuthStore();

  const [materials, setMaterials] = useState<BusbarMaterial[]>([]);
  const [vendorTiers, setVendorTiers] = useState<BusbarVendor[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Filter
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterVendor, setFilterVendor] = useState("all");

  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const headers = {
          "X-User-Role": role || "",
          "X-User-Company": companyName || "",
        };

        // Ambil material (sudah otomatis ter-filter tier oleh backend untuk viewer)
        const [matRes, vendorRes] = await Promise.all([
          fetch(`${baseUrl}/api/materials/`, { headers }),
          fetch(`${baseUrl}/api/busbar-vendors`, { headers }),
        ]);

        const matData = await matRes.json();
        const vendorData = await vendorRes.json();

        setMaterials(Array.isArray(matData) ? matData : []);
        setVendorTiers(Array.isArray(vendorData) ? vendorData : []);
      } catch (err) {
        console.error("Gagal tarik data busbar:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (role) fetchData();
  }, [role, companyName]);

  // Map vendorCode -> tier
  const tierMap = useMemo(() => {
    const map: Record<string, "T1" | "T2"> = {};
    vendorTiers.forEach((v) => {
      map[v.companyName] = v.tier;
    });
    return map;
  }, [vendorTiers]);

  const getTier = (vendorCode: string): "T1" | "T2" | "Lainnya" => {
    return tierMap[vendorCode] || "Lainnya";
  };

  // Role busbar (vendor/viewer T1/T2) hanya lihat satu tier dan tanpa teks perbandingan.
  // Superuser/Admin/Viewer internal lihat kedua tier + teks perbandingan.
  const isBusbarScoped = isBusbarRole(role);
  const visibleTiers = useMemo(() => visibleBusbarTiers(role), [role]);

  // Metadata tampilan per tier — dipakai untuk render kartu KPI secara dinamis.
  const TIER_META: Record<
    BusbarTier,
    { label: string; accent: string; heading: string; border: string }
  > = {
    T1: {
      label: "Tier 1 (Supplier Utama)",
      accent: "text-green-700",
      heading: "text-green-700",
      border: "border-l-green-600",
    },
    T2: {
      label: "Tier 2 (Supplier Raw Material)",
      accent: "text-blue-700",
      heading: "text-blue-700",
      border: "border-l-blue-600",
    },
  };

  // Filtering
  const filteredData = useMemo(() => {
    return materials.filter((m) => {
      const mName = String(m.material || "").toLowerCase();
      const mDesc = String(m.materialDescription || "").toLowerCase();
      const mVendor = String(m.vendorCode || "").trim();

      const matchSearch =
        mName.includes(filterMaterial.toLowerCase()) ||
        mDesc.includes(filterMaterial.toLowerCase());
      const matchVendor = filterVendor === "all" || mVendor === filterVendor;

      return matchSearch && matchVendor;
    });
  }, [materials, filterMaterial, filterVendor]);

  // Statistik per tier
  const stats = useMemo(() => {
    const result = {
      T1: { stock: 0, openPO: 0, materials: 0 },
      T2: { stock: 0, openPO: 0, materials: 0 },
    };

    filteredData.forEach((m) => {
      const tier = getTier(m.vendorCode);
      if (tier === "T1" || tier === "T2") {
        result[tier].stock += Number(m.vendorStock ?? 0);
        result[tier].openPO += Number(m.openPO ?? 0);
        result[tier].materials += 1;
      }
    });

    return result;
  }, [filteredData, tierMap]);

  // Data chart: Stock & Open PO per vendor (dikelompokkan tier)
  const perVendorData = useMemo(() => {
    const map: Record<
      string,
      { name: string; tier: string; stock: number; openPO: number }
    > = {};

    filteredData.forEach((m) => {
      const vendor = String(m.vendorCode || "N/A").trim();
      const tier = getTier(vendor);
      if (tier === "Lainnya") return;

      if (!map[vendor]) {
        map[vendor] = { name: vendor, tier, stock: 0, openPO: 0 };
      }
      map[vendor].stock += Number(m.vendorStock ?? 0);
      map[vendor].openPO += Number(m.openPO ?? 0);
    });

    // Urutkan: T1 dulu baru T2
    return Object.values(map).sort((a, b) => a.tier.localeCompare(b.tier));
  }, [filteredData, tierMap]);

  const vendorOptions = useMemo(() => {
    return [
      ...new Set(
        materials
          .map((m) => String(m.vendorCode || "").trim())
          .filter(Boolean)
      ),
    ].sort();
  }, [materials]);

  if (isLoading)
    return <div className="p-4 text-center mt-10">Loading Data Busbar...</div>;

  return (
    <div className="flex flex-col gap-3 w-full pb-8 h-[calc(100vh-90px)] overflow-y-auto px-4 md:px-6">
      {/* HEADER */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Dashboard Busbar</h1>
          <p className="text-xs text-gray-500">
            {isBusbarScoped
              ? "Monitoring Vendor Stock & Open PO"
              : "Monitoring Vendor Stock & Open PO — Tier 1 vs Tier 2"}
          </p>
        </div>
      </div>

      {/* FILTER */}
      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border shadow-sm">
        <input
          type="text"
          placeholder="Cari Material / Deskripsi..."
          className="text-xs border py-1.5 px-3 rounded-md flex-1 min-w-[150px] outline-none focus:ring-2 focus:ring-green-600"
          value={filterMaterial}
          onChange={(e) => setFilterMaterial(e.target.value)}
        />
        <select
          className="text-xs border py-1.5 px-3 rounded-md outline-none bg-white"
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
        >
          <option value="all">Semua Vendor</option>
          {vendorOptions.map((v) => (
            <option key={v} value={v}>
              {v} {tierMap[v] ? `(${tierMap[v]})` : ""}
            </option>
          ))}
        </select>
      </div>

      {/* KPI CARDS PER TIER */}
      <div
        className={`grid grid-cols-1 gap-4 ${
          visibleTiers.length > 1 ? "md:grid-cols-2" : ""
        }`}
      >
        {visibleTiers.map((tier) => {
          const meta = TIER_META[tier];
          return (
            <div
              key={tier}
              className={`bg-white rounded-xl border shadow-sm p-4 border-l-4 ${meta.border}`}
            >
              <div className="flex items-center justify-between mb-3">
                <h2 className={`text-sm font-bold ${meta.heading}`}>
                  {meta.label}
                </h2>
                <span className="text-xs text-gray-400">
                  {stats[tier].materials} material
                </span>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Total Vendor Stock
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats[tier].stock.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400">pcs</p>
                </div>
                <div className="text-center">
                  <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
                    Total Open PO
                  </p>
                  <p className="text-2xl font-bold text-gray-800">
                    {stats[tier].openPO.toLocaleString()}
                  </p>
                  <p className="text-[10px] text-gray-400">pcs</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* CHART: Vendor Stock per Vendor */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-1">
          Vendor Stock per Supplier
        </h3>
        {!isBusbarScoped && (
          <p className="text-xs text-gray-500 mb-3">
            Warna hijau = Tier 1, biru = Tier 2
          </p>
        )}
        {perVendorData.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            Belum ada data supplier busbar untuk ditampilkan.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perVendorData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="stock" name="Vendor Stock" radius={[4, 4, 0, 0]}>
                {perVendorData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.tier === "T1" ? TIER_COLORS.T1 : TIER_COLORS.T2
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>

      {/* CHART: Open PO per Vendor */}
      <div className="bg-white rounded-xl border shadow-sm p-4">
        <h3 className="text-sm font-bold text-gray-800 mb-1">
          Open PO per Supplier
        </h3>
        {!isBusbarScoped && (
          <p className="text-xs text-gray-500 mb-3">
            Warna hijau = Tier 1, biru = Tier 2
          </p>
        )}
        {perVendorData.length === 0 ? (
          <p className="text-xs text-gray-400 text-center py-8">
            Belum ada data supplier busbar untuk ditampilkan.
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={perVendorData}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} />
              <XAxis
                dataKey="name"
                tick={{ fontSize: 10 }}
                angle={-15}
                textAnchor="end"
                height={60}
              />
              <YAxis tick={{ fontSize: 10 }} />
              <Tooltip />
              <Bar dataKey="openPO" name="Open PO" radius={[4, 4, 0, 0]}>
                {perVendorData.map((entry, index) => (
                  <Cell
                    key={`cell-po-${index}`}
                    fill={
                      entry.tier === "T1" ? TIER_COLORS.T1 : TIER_COLORS.T2
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </div>
  );
}