"use client";

import React, { useMemo } from "react";
import {
  PieChart,
  Pie,
  Cell,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export default function ChartSectionSupplier({ stats, materialPerVendor, materials }: any) {
  
  const pieData = [
    { name: "Critical", value: stats.critical, color: "#ef4444" },
    { name: "Warning", value: stats.warning, color: "#f59e0b" },
    { name: "Safe", value: stats.safe, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const statusColors = {
    critical: "#ef4444",
    warning: "#f59e0b",
    safe: "#10b981",
  };

  const stackedFmrsData = useMemo(() => {
    if (!materials || materials.length === 0) return [];
    
    const fmrsList = ["F", "M", "R", "S"];
    return fmrsList.map((fmrs) => {
      const items = materials.filter((m: any) => (m.fmrs || "N/A") === fmrs);
      const critical = items.filter((m: any) => m.warningStatus === "critical").length;
      const warning = items.filter((m: any) => m.warningStatus === "warning").length;
      const safe = items.filter((m: any) => m.warningStatus !== "critical" && m.warningStatus !== "warning").length;
      
      return { name: fmrs, critical, warning, safe };
    });
  }, [materials]);

  return (
    // Gap diperkecil jadi gap-4
    <div className="flex flex-col gap-4">
      
      {/* --- BARIS 1: Status & FMRS --- */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. Status Material (Pie Chart) */}
        {/* Padding diperkecil jadi p-4 */}
        <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center">
          <h2 className="text-base font-bold text-gray-800 mb-2 text-center w-full">Status Material Supplier</h2>
          {/* Tinggi diperkecil jadi h-60 */}
          <div className="h-60 w-full"> 
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={50} // Radius donat dikecilkan
                  outerRadius={70} // Radius donat dikecilkan
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Material per FMRS (Stacked Chart) */}
        <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center">
          <h2 className="text-base font-bold text-gray-800 mb-2 text-center w-full">Status per FMRS</h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedFmrsData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                {/* Lebar batang disempitkan jadi barSize={25} */}
                <Bar dataKey="critical" stackId="a" fill={statusColors.critical} name="Critical" barSize={25} />
                <Bar dataKey="warning" stackId="a" fill={statusColors.warning} name="Warning" barSize={25} />
                <Bar dataKey="safe" stackId="a" fill={statusColors.safe} name="Safe" barSize={25} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- BARIS 2: Material per Vendor --- */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center w-full">
        <h2 className="text-base font-bold text-gray-800 mb-2 text-center w-full">Status Material per Vendor</h2>
        <div className="h-60 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={materialPerVendor} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis dataKey="name" tick={{ fontSize: 11 }} interval={0} angle={-15} textAnchor="end" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              <Bar dataKey="critical" stackId="a" fill={statusColors.critical} name="Critical" barSize={25} />
              <Bar dataKey="warning" stackId="a" fill={statusColors.warning} name="Warning" barSize={25} />
              <Bar dataKey="safe" stackId="a" fill={statusColors.safe} name="Safe" barSize={25} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}