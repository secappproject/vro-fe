"use client";

import React, { useState, useEffect, useMemo, useCallback } from "react";
import { usePathname, useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/types";
import StatCards from "./components/StatCards";
import ChartSection from "./components/ChartSection";
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

  // Statistik
  const stats = useMemo(() => {
    let critical = 0, warning = 0, blocked = 0, safe = 0;
    filteredData.forEach((m) => {
      const s = getSupplierStatus(m);
      if (s === "critical") critical++;
      else if (s === "warning") warning++;
      else if (s === "blocked") blocked++;
      else safe++;
    });
    return { critical, warning, blocked, safe, total: filteredData.length };
  }, [filteredData, getSupplierStatus]);

  // Chart data
  const materialPerFmrs = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((m) => {
      const fmrs = m.fmrs || "N/A";
      map[fmrs] = (map[fmrs] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  const materialPerVendor = useMemo(() => {
    const map: Record<string, number> = {};
    filteredData.forEach((m) => {
      const vendor = m.vendorCode || "N/A";
      map[vendor] = (map[vendor] || 0) + 1;
    });
    return Object.entries(map).map(([name, value]) => ({ name, value }));
  }, [filteredData]);

  if (isLoading) return <div className="p-4 text-center mt-10">Loading Supplier Stock Data...</div>;

  return (
    <div className="flex flex-col gap-6 w-full pb-32 h-[calc(100vh-90px)] overflow-y-auto px-4 md:px-6">
      
      {/* HEADER & TOGGLE BUTTONS */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 bg-white p-4 rounded-xl shadow-sm border">
        <div>
          <h1 className="text-xl font-bold text-gray-800">Dashboard Supplier Stock</h1>
          <p className="text-xs text-gray-500">Monitoring Stok Vendor (AMU × FMRS = Safety Stock)</p>
        </div>

        {/* TOGGLE WHS STOCK / SUPPLIER STOCK */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
          <button
            onClick={() => router.push("/dashboard-rpl")}
            className={`px-3 py-1 text-sm rounded-md font-medium ${
              pathname === "/dashboard-rpl" ? "bg-blue-600 text-white" : "text-gray-600"
            }`}
          >
            WHS Stock
          </button>
          <button
            onClick={() => router.push("/dashboard-supplier")}
            className={`px-3 py-1 text-sm rounded-md font-medium ${
              pathname === "/dashboard-supplier" ? "bg-blue-600 text-white" : "text-gray-600"
            }`}
          >
            Supplier Stock
          </button>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="flex flex-wrap gap-2 bg-white p-4 rounded-xl border shadow-sm">
        <input
          type="text"
          placeholder="Cari Material..."
          className="text-sm border p-2 rounded-md flex-1 min-w-[150px] outline-none focus:ring-2 focus:ring-blue-500"
          value={filterMaterial}
          onChange={(e) => setFilterMaterial(e.target.value)}
        />

        <select
          className="text-sm border p-2 rounded-md outline-none bg-white"
          value={filterVendor}
          onChange={(e) => setFilterVendor(e.target.value)}
        >
          <option value="all">Semua Vendor</option>
          {[...new Set(materials.map((m) => m.vendorCode).filter(Boolean))].sort().map((v) => (
            <option key={v} value={v}>{v}</option>
          ))}
        </select>

        <select
          className="text-sm border p-2 rounded-md outline-none bg-white"
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
        >
          <option value="all">Semua Status</option>
          <option value="critical">Critical </option>
          <option value="warning">Warning </option>
          <option value="safe">Safe </option>
          <option value="blocked">Blocked</option>
        </select>

        <select
          className="text-sm border p-2 rounded-md outline-none bg-white"
          value={filterFmrs}
          onChange={(e) => setFilterFmrs(e.target.value)}
        >
          <option value="all">Semua FMRS</option>
          <option value="F">F </option>
          <option value="M">M </option>
          <option value="R">R </option>
          <option value="S">S </option>
        </select>
      </div>

      <StatCards stats={stats} />
      <ChartSection 
  stats={stats} 
  materialPerVendor={materialPerVendor}
  materials={filteredData} 
/>
     {/*<DataTable data={filteredData} getStatus={getSupplierStatus} />*/}
    </div>
  );
}