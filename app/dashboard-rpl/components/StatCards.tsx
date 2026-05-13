"use client";

import React from "react";

export default function StatCards({ stats }: any) {

  const cards = [
    { label: "SHORTAGE", value: stats?.shortage || 0, unit: "Materials", color: "border-l-red-500 text-red-600" },
    { label: "BLOCKED", value: stats?.blocked || 0, unit: "Materials", color: "border-l-orange-500 text-orange-600" },
    { label: "TOTAL ITEMS", value: stats?.total || 0, unit: "Materials", color: "border-l-green-500 text-green-600" },
    { label: "OPEN PO Qty", value: stats?.OpenPO || 0, unit: "PO", color: "border-l-blue-500 text-blue-600" },
    { label: "VENDOR STOCK", value: stats?.VendorStock || 0, unit: "Pcs", color: "border-l-purple-500 text-purple-600" }, 
  ];

  return (
    <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
      {cards.map((card, i) => (
        <div key={i} className={`bg-white py-2 px-3 rounded-xl border-l-4 shadow-sm flex flex-col items-center justify-center text-center ${card.color}`}>
          <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{card.label}</span>
          <div className="flex items-baseline gap-1 mt-0.5">
            <span className="text-xl font-bold">{card.value}</span>
            <span className="text-xs font-medium text-gray-400 lowercase">{card.unit}</span>
          </div>
        </div>
      ))}
    </div>
  );
}