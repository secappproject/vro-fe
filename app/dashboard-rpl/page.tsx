"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/types";

import StatCards from "./components/StatCards";
import ChartSection from "./components/ChartSection";
import DataTable from "./components/DataTable";

export default function DashboardRplPage() {
  const { role, companyName } = useAuthStore();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Filter states
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterType, setFilterType] = useState("Semua Tipe");

  // Fetch data
  useEffect(() => {
    const fetchData = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL;
        const res = await fetch(`${baseUrl}/api/materials/`, {
          headers: {
            "X-User-Role": role || "",
            "X-User-Company": companyName || "",
          },
        });
        const data = await res.json();
        setMaterials(Array.isArray(data) ? data : []);
      } catch (err) {
        console.error("Gagal tarik data:", err);
      } finally {
        setIsLoading(false);
      }
    };
    if (role) fetchData();
  }, [role, companyName]);

  // Logic Status Material
  const getMaterialStatus = useCallback((m: any): string => {
    const type = String(m.productType || "").toLowerCase();
    const remark = m.remarkBlock?.String || "";
    const remarkValid = m.remarkBlock?.Valid || false;
    const current = Number(m.currentQuantity ?? 0);
    const max = Number(m.maxBinQty ?? 0);

    if (type === "block" || (remarkValid && remark !== "")) return "blocked";
    if (max === 0) return "ok";
    if (current <= 0.3 * max) return "shortage";
    if (current <= 0.6 * max) return "preshortage";
    return "ok";
  }, []);

  // Filtering
  const filteredData = useMemo(() => {
    return materials.filter((m) => {
      const mVendor = String(m.vendorCode || "").trim();
      const mStatus = getMaterialStatus(m);
      const mName = String(m.material || "").toLowerCase();
      const mType = String(m.productType || "N/A").trim().toLowerCase();

      const matchVendor = filterVendor === "all" || mVendor === filterVendor;
      const matchStatus = filterStatus === "all" || mStatus === filterStatus;
      const matchType = filterType === "Semua Tipe" || mType === filterType.toLowerCase();
      const matchSearch = mName.includes(filterMaterial.toLowerCase());

      return matchVendor && matchStatus && matchType && matchSearch;
    });
  }, [materials, filterVendor, filterStatus, filterMaterial, filterType, getMaterialStatus]);

  // Statistik
  const stats = useMemo(() => {
  let shortage = 0, preshortage = 0, blocked = 0, ok = 0;
  let totalOpenPO = 0;           
  let totalVendorStock = 0;      

  filteredData.forEach((m) => {
    const s = getMaterialStatus(m);
    if (s === "shortage") shortage++;
    else if (s === "preshortage") preshortage++;
    else if (s === "blocked") blocked++;
    else ok++;

    totalOpenPO += Number(m.openPO ?? 0);
    totalVendorStock += Number(m.vendorStock ?? 0);
  });

if (filteredData.length > 0) {
  console.log("FIELD NAMES dalam material:", Object.keys(filteredData[0]));
  console.log("Isi lengkap material:", filteredData[0]);
}
  return { 
    shortage, 
    preshortage, 
    blocked, 
    ok, 
    total: filteredData.length, 
    OpenPO: totalOpenPO, 
    VendorStock: totalVendorStock 
  };
}, [filteredData, getMaterialStatus]);

  // Data Charts: Material per Tipe
  const materialPerType = useMemo(() => {
    const map: Record<string, { shortage: number; preshortage: number; ok: number }> = {};
    
    filteredData.forEach((m) => {
      const type = m.productType || "N/A";
      
      if (!map[type]) {
        map[type] = { shortage: 0, preshortage: 0, ok: 0 };
      }

      const status = getMaterialStatus(m);
      if (status === "shortage") map[type].shortage++;
      else if (status === "preshortage") map[type].preshortage++;
      else if (status === "ok") map[type].ok++;
    });
    
    return Object.entries(map).map(([name, counts]) => ({ name, ...counts }));
  }, [filteredData, getMaterialStatus]);

  // Data Charts: Material per Vendor
  const materialPerVendor = useMemo(() => {
    const map: Record<string, { shortage: number; preshortage: number; ok: number }> = {};
    
    filteredData.forEach((m) => {
      const vendor = String(m.vendorCode || "N/A").trim();
      
      if (!map[vendor]) {
        map[vendor] = { shortage: 0, preshortage: 0, ok: 0 };
      }

      const status = getMaterialStatus(m);
      if (status === "shortage") map[vendor].shortage++;
      else if (status === "preshortage") map[vendor].preshortage++;
      else if (status === "ok") map[vendor].ok++;
    });
    
    return Object.entries(map).map(([name, counts]) => ({ name, ...counts }));
  }, [filteredData, getMaterialStatus]);

  if (isLoading) return <div className="p-4 text-center mt-10">Loading Data...</div>;

  return (
    <div className="flex flex-col gap-3 w-full pb-8 h-[calc(100vh-90px)] overflow-y-auto px-4 md:px-6">
      
      {/* HEADER & TOGGLE BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-lg font-bold text-gray-800">RPL Dashboard</h1>
          <p className="text-xs text-gray-500">Monitoring Stock & Vendor Performance</p>
        </div>

        {/* TOGGLE WHS STOCK / SUPPLIER STOCK */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => router.push("/dashboard-rpl")}
            className={`px-3 py-1 text-xs rounded-md font-medium ${
              pathname === "/dashboard-rpl" ? "bg-blue-600 text-white" : "text-gray-600"
            }`}
          >
            WHS Stock
          </button>
          <button
            onClick={() => router.push("/dashboard-supplier")}
            className={`px-3 py-1 text-xs rounded-md font-medium ${
              pathname === "/dashboard-Vendor" ? "bg-blue-600 text-white" : "text-gray-600"
            }`}
          >
            Vendor Stock
          </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="flex flex-wrap gap-2 bg-white p-3 rounded-xl border shadow-sm">
        <input
          type="text"
          placeholder="Cari Material..."
          className="text-xs border py-1.5 px-3 rounded-md flex-1 min-w-[150px] outline-none focus:ring-2 focus:ring-blue-500"
          value={filterMaterial}
          onChange={(e) => setFilterMaterial(e.target.value)}
        />

        <select
          className="text-xs border py-1.5 px-3 rounded-md outline-none bg-white"
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
        >
          <option value="all">Semua Vendor</option>
          {[...new Set(materials.map((m) => String(m.vendorCode || "").trim()).filter(Boolean))].sort().map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        <select
          className="text-xs border py-1.5 px-3 rounded-md outline-none bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Semua Status</option>
          <option value="shortage">Shortage</option>
          <option value="preshortage">Pre-Shortage</option>
          <option value="blocked">Blocked</option>
          <option value="ok">OK</option>
        </select>

        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value)}
          className="text-xs border py-1.5 px-3 rounded-md outline-none bg-white cursor-pointer"
        >
          <option value="Semua Tipe">Semua Tipe</option>
          <option value="special">Special</option>
          <option value="kanban">Kanban</option>
          <option value="block">Block</option>
        </select>
      </div>

      <StatCards stats={stats} />
      
      <ChartSection 
        stats={stats} 
        materialPerType={materialPerType} 
        materialPerVendor={materialPerVendor} 
        materials={filteredData}
      />
      
    </div>
  );
}