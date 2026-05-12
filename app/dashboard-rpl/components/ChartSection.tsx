"use client";

import React from "react";
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

export default function ChartSection({ stats, materialPerType, materialPerVendor }: any) {
  
  // 1. Setup data buat Pie Chart
  const pieData = [
    { name: "Shortage", value: stats.shortage, color: "#ef4444" },    // Merah
    { name: "Preshortage", value: stats.preshortage, color: "#eab308" }, // Kuning
    { name: "OK", value: stats.ok, color: "#10b981" },                // Hijau
  ].filter((d) => d.value > 0);

  // 2. Setup Warna untuk Stacked Chart
  const statusColors = {
    shortage: "#ef4444",    // Merah
    preshortage: "#eab308", // Kuning
    ok: "#10b981",          // Hijau
  };

  return (
    // Gap utama diperkecil jadi gap-4
    <div className="flex flex-col gap-4">
      
      {/* --- BARIS 1: Status & Tipe (2 Kolom Sejajar) --- */}
      {/* Gap grid diperkecil jadi gap-4 */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* 1. Status Material (Pie Chart) */}
        {/* Padding diperkecil jadi p-4 */}
        <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center">
          <h2 className="text-base font-bold text-gray-800 mb-2 text-center w-full">Status Material</h2>
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
                {/* Legenda dikecilkan */}
                <Legend verticalAlign="bottom" height={36} iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* 2. Material per Tipe (Stacked Chart) */}
        <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center">
          <h2 className="text-base font-bold text-gray-800 mb-2 text-center w-full">Status Material per Tipe</h2>
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={materialPerType} margin={{ top: 10, right: 10, left: -20, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e5e7eb" />
                <XAxis 
                  dataKey="name" 
                  tick={{ fontSize: 11 }} 
                  interval={0} 
                  angle={-15} 
                  textAnchor="end"
                />
                <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                <Tooltip cursor={{ fill: '#f3f4f6' }} />
                <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
                {/* Lebar batang disempitkan jadi barSize={25} */}
                <Bar dataKey="shortage" stackId="a" fill={statusColors.shortage} name="Shortage" barSize={25} />
                <Bar dataKey="preshortage" stackId="a" fill={statusColors.preshortage} name="Preshortage" barSize={25} />
                <Bar dataKey="ok" stackId="a" fill={statusColors.ok} name="OK" barSize={25} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

      </div>

      {/* --- BARIS 2: Material per Vendor (Sekarang Stacked Chart!) --- */}
      <div className="bg-white p-4 rounded-2xl border shadow-sm flex flex-col items-center w-full">
        <h2 className="text-base font-bold text-gray-800 mb-2 text-center w-full">Status Material per Vendor</h2>
        <div className="h-60 w-full">
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
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip cursor={{ fill: '#f3f4f6' }} />
              <Legend iconSize={10} wrapperStyle={{ fontSize: "12px" }} />
              {/* Lebar batang disempitkan jadi barSize={25} */}
              <Bar dataKey="shortage" stackId="a" fill={statusColors.shortage} name="Shortage" barSize={25} />
              <Bar dataKey="preshortage" stackId="a" fill={statusColors.preshortage} name="Preshortage" barSize={25} />
              <Bar dataKey="ok" stackId="a" fill={statusColors.ok} name="OK" barSize={25} radius={[4, 4, 0, 0]} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

    </div>
  );
}