"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/types";
import StatCards from "../dashboard-rpl/components/StatCards";
import ChartSectionSupplier from "./components/ChartSection";
import DataTable from "./components/DataTable";

export default function DashboardSupplierPage() {
  const { role, companyName } = useAuthStore();
  const [materials, setMaterials] = useState<any[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  // Filter states
  const [filterVendor, setFilterVendor] = useState("all");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterMaterial, setFilterMaterial] = useState("");
  const [filterFmrs, setFilterFmrs] = useState("all");

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

  // Status berdasarkan warningStatus
  const getSupplierStatus = useCallback((m: any): string => {
    if (m.productType === "block" || (m.remarkBlock?.Valid && m.remarkBlock?.String !== "")) {
      return "blocked";
    }
    if (m.warningStatus === "critical") return "critical";
    if (m.warningStatus === "warning") return "warning";
    return "safe";
  }, []);

  // Filtering
  const filteredData = useMemo(() => {
    return materials.filter((m) => {
      const matchVendor = filterVendor === "all" || (m.vendorCode || "") === filterVendor;
      const matchStatus = filterStatus === "all" || getSupplierStatus(m) === filterStatus;
      const matchMaterial = (m.material || "").toLowerCase().includes(filterMaterial.toLowerCase());
      const matchFmrs = filterFmrs === "all" || (m.fmrs || "") === filterFmrs;
      return matchVendor && matchStatus && matchMaterial && matchFmrs;
    });
  }, [materials, filterVendor, filterStatus, filterMaterial, filterFmrs, getSupplierStatus]);

  // Statistik (SAMA SEPERTI RPL, tapi dengan critical, warning, safe)
  const stats = useMemo(() => {
    let critical = 0, warning = 0, blocked = 0, safe = 0;
    let totalOpenPO = 0;
    let totalVendorStock = 0;

    filteredData.forEach((m) => {
      const s = getSupplierStatus(m);
      if (s === "critical") critical++;
      else if (s === "warning") warning++;
      else if (s === "blocked") blocked++;
      else safe++;

      // Tambahkan OpenPO dan VendorStock (SAMA KAYAK RPL)
      totalOpenPO += Number(m.openPO ?? 0);
      totalVendorStock += Number(m.vendorStock ?? 0);
    });

    return { 
      critical, 
      warning, 
      blocked, 
      safe, 
      total: filteredData.length,
      OpenPO: totalOpenPO,
      VendorStock: totalVendorStock
    };
  }, [filteredData, getSupplierStatus]);

  // Chart data FMRS
  const materialPerFmrs = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((m) => {
      const fmrs = m.fmrs || "N/A";
      map[fmrs] = (map[fmrs] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  // Chart data Vendor 
  const materialPerVendor = useMemo(() => {
    const map: Record<string, { critical: number; warning: number; safe: number }> = {};
    
    filteredData.forEach((m) => {
      const vendor = String(m.vendorCode || "N/A").trim();
      
      if (!map[vendor]) {
        map[vendor] = { critical: 0, warning: 0, safe: 0 };
      }

      const status = getSupplierStatus(m);
      if (status === "critical") map[vendor].critical++;
      else if (status === "warning") map[vendor].warning++;
      else if (status === "safe") map[vendor].safe++; 
    });
    
    return Object.entries(map).map(([name, counts]) => ({ name, ...counts }));
  }, [filteredData, getSupplierStatus]);

  if (isLoading) return <div className="p-4 text-center mt-10">Loading Supplier Stock Data...</div>;

  return (
    <div className="flex flex-col gap-3 w-full pb-8 h-[calc(100vh-90px)] overflow-y-auto px-4 md:px-6">
      
      {/* HEADER & TOGGLE BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3 bg-white p-3 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-lg font-bold text-gray-800">Dashboard Supplier Stock</h1>
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
              pathname === "/dashboard-supplier" ? "bg-blue-600 text-white" : "text-gray-600"
            }`}
          >
            Supplier Stock
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
          {[...new Set(materials.map((m) => m.vendorCode).filter(Boolean))].sort().map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        <select
          className="text-xs border py-1.5 px-3 rounded-md outline-none bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Semua Status</option>
          <option value="critical">Critical</option>
          <option value="warning">Warning</option>
          <option value="safe">Safe</option>
          <option value="blocked">Blocked</option>
        </select>

        <select
          className="text-xs border py-1.5 px-3 rounded-md outline-none bg-white"
          value={filterFmrs}
          onChange={(e) => setFilterFmrs(e.target.value)}
        >
          <option value="all">Semua FMRS</option>
          <option value="F">F</option>
          <option value="M">M</option>
          <option value="R">R</option>
          <option value="S">S</option>
        </select>
      </div>

      {/* STAT CARDS - PAKAI YANG SAMA DENGAN RPL */}
      <StatCards stats={stats} />
      
      <ChartSectionSupplier 
        stats={stats} 
        materialPerVendor={materialPerVendor}
        materials={filteredData} 
      />
      
    </div>
  );
}