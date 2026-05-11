"use client";

import React from "react";

export default function StatCards({ stats }: any) {
  const cards = [
    { label: "WARNING (SKU)", value: stats.warning || 0, color: "border-l-yellow-500 text-yellow-600" },
    { label: "BLOCKED (SKU)", value: stats.blocked || 0, color: "border-l-orange-500 text-orange-600" },
    { label: "TOTAL ITEMS (SKU)", value: stats.total || 0, color: "border-l-green-500 text-green-600" },
    { label: "OPEN PO QTY", value: stats.openpo || 0, color: "border-l-blue-500 text-blue-600" },
    { label: "VENDOR STOCK QTY", value: stats.vendorStock || 0, color: "border-l-purple-500 text-purple-600" },
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <div 
          key={i} 
          className={`bg-white p-4 rounded-xl border-l-4 shadow-sm flex flex-col items-center justify-center text-center ${card.color}`}
        >
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
            {card.label}
          </span>
          <span className="text-2xl font-bold mt-1">
            {card.value}
          </span>
        </div>
      ))}
    </div>
  );
}