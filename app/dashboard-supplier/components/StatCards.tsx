"use client";

import React from "react";

export default function StatCards({ stats }: any) {
  const cards = [
    { label: "WARNING", value: stats.warning || 0, unit: "Materials", color: "border-l-yellow-500 text-yellow-600" },
    { label: "BLOCKED", value: stats.blocked || 0, unit: "Materials", color: "border-l-orange-500 text-orange-600" },
    { label: "TOTAL ITEMS", value: stats.total || 0, unit: "Materials", color: "border-l-green-500 text-green-600" },
    { label: "OPEN PO Qty", value: stats.openpo || 0, unit: "PO", color: "border-l-blue-500 text-blue-600" },
    { label: "VENDOR STOCK", value: stats.vendorStock || 0, unit: "Pcs", color: "border-l-purple-500 text-purple-600" }, 
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <div 
          key={i} 
          // DIUBAH: p-4 jadi py-2 px-3 biar atas-bawah ceper
          className={`bg-white py-2 px-3 rounded-xl border-l-4 shadow-sm flex flex-col items-center justify-center text-center ${card.color}`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {card.label}
          </span>
          {/* DIUBAH: mt-1 jadi mt-0.5 biar angka lebih nempel ke judul */}
          <div className="flex items-baseline gap-1 mt-0.5">
            {/* DIUBAH: text-2xl jadi text-xl biar angkanya nggak kebesaran */}
            <span className="text-xl font-bold">
              {card.value}
            </span>
            <span className="text-xs font-medium text-gray-400 lowercase">
              {card.unit}
            </span>
          </div>
        </div>
      ))}
    </div>
  );
}