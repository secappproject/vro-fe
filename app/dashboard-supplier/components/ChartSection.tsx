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

export default function ChartSection({ stats, materialPerVendor, materials }: any) {
  const pieData = [
    { name: "Critical", value: stats.critical, color: "#ef4444" },
    { name: "Warning", value: stats.warning, color: "#f59e0b" },
    { name: "Safe", value: stats.safe, color: "#10b981" },
  ].filter((d) => d.value > 0);

  const stackedChartData = useMemo(() => {
    const fmrsList = ["F", "M", "R", "S"];
    return fmrsList.map((fmrs) => {
      const items = materials?.filter((m: any) => m.fmrs === fmrs) || [];
      const critical = items.filter((m: any) => m.warningStatus === "critical").length;
      const warning = items.filter((m: any) => m.warningStatus === "warning").length;
      const safe = items.filter((m: any) => m.warningStatus === "safe").length;
      return { fmrs, critical, warning, safe, total: items.length };
    });
  }, [materials]);

  const statusColors = {
    critical: "#ef4444",
    warning: "#f59e0b",
    safe: "#10b981",
  };

  return (
    <div className="flex flex-col gap-6">
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Pie Chart */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm flex flex-col items-center">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
            Status Supplier Stock (Safety Stock)
          </h2>
          <div className="h-72 w-full"> {/* Disamakan h-72 agar seimbang */}
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label
                >
                  {pieData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Stacked Chart per FMRS (VERTIKAL) */}
        <div className="bg-white p-6 rounded-2xl border shadow-sm">
          <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">
            Stacked Chart per FMRS (Critical, Warning, Safe)
          </h2>
          <div className="h-72 w-full"> {/* Diubah dari h-80 ke h-72 agar sama dengan Vendor */}
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={stackedChartData} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="fmrs" 
                  tick={{ fontSize: 11 }} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Legend />
                <Bar dataKey="critical" stackId="a" fill={statusColors.critical} name="Critical" barSize={45} />
                <Bar dataKey="warning" stackId="a" fill={statusColors.warning} name="Warning" barSize={45} />
                <Bar dataKey="safe" stackId="a" fill={statusColors.safe} name="Safe" barSize={45} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Bar Chart per Vendor */}
      <div className="bg-white p-6 rounded-2xl border shadow-sm">
        <h2 className="text-lg font-bold text-gray-800 mb-4 text-center">Material per Vendor</h2>
        <div className="h-72 w-full">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={materialPerVendor} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
              <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
              <XAxis 
                dataKey="name" 
                tick={{ fontSize: 11 }} 
                interval={0} 
                angle={-15} 
                textAnchor="end"
              />
              <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Bar dataKey="value" fill="#8b5cf6" radius={[4, 4, 0, 0]} barSize={45} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}