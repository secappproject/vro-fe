"use client";

import { Material } from "@/lib/types";
import { BinPreviewSkeleton } from "./bin-preview-skeleton";

interface BinPreviewProps {
  material: Material;
}

function KanbanBinPreview({ material }: BinPreviewProps) {
  const { packQuantity, maxBinQty, minBinQty, currentQuantity = 0 } = material;

  if (packQuantity <= 0 || maxBinQty <= 0) {
    return (
      <div className="w-full min-w-[150px]">
        <div className="flex justify-between text-xs font-mono mb-1">
          <span className="text-gray-500">Preview...</span>
        </div>
        <div className="flex space-x-1 h-3">
          <div className="relative flex-1 h-full bg-gray-200 rounded-sm" />
        </div>
      </div>
    );
  }

  // --- LOGIKA KANBAN DIUBAH JADI SEGMENTED ---
  const current = currentQuantity;
  const shortagePoint = Math.ceil(maxBinQty * 0.3);
  const preshortagePoint = Math.ceil(maxBinQty * 0.6);

  let overallColorClass = "bg-green-500";
  if (current <= shortagePoint) {
    overallColorClass = "bg-red-500";
  } else if (current > shortagePoint && current <= preshortagePoint) {
    overallColorClass = "bg-yellow-500";
  }

  if (current < 0 || current > maxBinQty) {
    overallColorClass = "bg-destructive";
  }

  const totalBins = Math.ceil(maxBinQty / packQuantity);
  const bins = Array.from({ length: totalBins }, (_, i) => i);

  return (
    <div className="w-full min-w-[150px]">
      <div className="flex justify-between text-xs font-mono mb-1">
        <span
          className={`${
            current < 0 || current > maxBinQty
              ? "text-destructive font-bold"
              : ""
          }`}
        >
          Stok: {current} / {maxBinQty}
        </span>

        <span className="text-gray-500">
          (Min: {minBinQty}) ({totalBins} bin)
        </span>
      </div>

      <div className="flex space-x-1 h-3">
        {bins.map((index) => {
          const binStartQty = index * packQuantity;
          const binEndQty = (index + 1) * packQuantity;

          let percent = 0;
          if (current >= binEndQty) {
            percent = 100;
          } else if (current > binStartQty) {
            const qtyInThisBin = current - binStartQty;
            percent = (qtyInThisBin / packQuantity) * 100;
          }
          if (current < 0) percent = 100;

          return (
            <div
              key={index}
              title={`Bin ${index + 1}`}
              className="relative flex-1 h-full bg-gray-200 rounded-sm overflow-hidden"
            >
              {percent > 0 && (
                <div
                  className={`absolute top-0 left-0 h-full transition-all ${overallColorClass}`}
                  style={{ width: `${percent > 100 ? 100 : percent}%` }}
                />
              )}
            </div>
          );
        })}
      </div>

      {/* --- SECTION LABEL BIN DITAMBAHKAN --- */}
      <div className="flex space-x-1 mt-1">
        {bins.map((index) => {
          const binStartQty = index * packQuantity;
          const binEndQty = (index + 1) * packQuantity;

          let currentBinStock = 0;
          if (current >= binEndQty) {
            currentBinStock = packQuantity;
          } else if (current > binStartQty) {
            currentBinStock = current - binStartQty;
          }
          
          const isFilled = currentBinStock > 0;

          return (
            <div
              key={index}
              className="flex-1 text-center font-mono text-[10px] leading-tight"
            >
              <div className="text-gray-500 text-[9px]">
                B{index + 1}
              </div>
              <span className={isFilled ? "font-bold" : "text-gray-400"}>
                {currentBinStock}/{packQuantity}
              </span>
            </div>
          );
        })}
      </div>
      {/* --- END SECTION LABEL BIN --- */}
    </div>
  );
  // --- AKHIR PERUBAHAN KANBAN ---
}

function MultiBinPreview({ material }: BinPreviewProps) {
  const { bins, currentQuantity, maxBinQty, minBinQty } = material;

  if (!bins || bins.length === 0) {
    return (
      <div className="w-full min-w-[150px]">
         <div className="flex justify-between text-xs font-mono mb-1">
           <span className="text-red-500">Data bin tidak ditemukan</span>
         </div>
         <div className="flex space-x-1 h-3">
           <div className="relative flex-1 h-full bg-gray-200 rounded-sm" />
         </div>
      </div>
    );
  }

  const shortagePoint = Math.ceil(maxBinQty * 0.3);
  const preshortagePoint = Math.ceil(maxBinQty * 0.6);
  let overallColorClass = "bg-green-500";

  if (currentQuantity <= shortagePoint) {
    overallColorClass = "bg-red-500";
  } else if (
    currentQuantity > shortagePoint &&
    currentQuantity <= preshortagePoint
  ) {
    overallColorClass = "bg-yellow-500";
  }
  
  if (currentQuantity < 0 || currentQuantity > maxBinQty) {
    overallColorClass = "bg-destructive";
  }

  return (
    <div className="w-full min-w-[150px]">
      <div className="flex justify-between text-xs font-mono mb-1">
        <span
           className={`${
            currentQuantity < 0 || currentQuantity > maxBinQty
              ? "text-destructive font-bold"
              : ""
          }`}
        >
          Stok: {currentQuantity} / {maxBinQty}
        </span>
        <span className="text-gray-500">
          (Min: {minBinQty}) ({bins.length} bin)
        </span>
      </div>

      <div className="flex space-x-1 h-3">
        {bins.map((bin) => {
          // --- DIUBAH: Tampilkan progres parsial ---
          const percent = bin.maxBinStock > 0 ? (bin.currentBinStock / bin.maxBinStock) * 100 : 0;
          // ------------------------------------

          return (
            <div
              key={bin.binSequenceId}
              title={`Bin ${bin.binSequenceId}: ${bin.currentBinStock}/${bin.maxBinStock}`}
              className={`relative flex-1 h-full rounded-sm transition-all bg-gray-200 overflow-hidden`}
            >
              {percent > 0 && (
                 <div
                  className={`absolute top-0 left-0 h-full transition-all ${overallColorClass}`}
                  style={{ width: `${Math.min(100, Math.max(0, percent))}%` }}
                />
              )}
            </div>
          );
        })}
      </div>

      <div className="flex space-x-1 mt-1">
        {bins.map((bin) => {
          const isFull = bin.currentBinStock > 0;
          return (
            <div
              key={bin.binSequenceId}
              className="flex-1 text-center font-mono text-[10px] leading-tight"
            >
              <div className="text-gray-500 text-[9px]">
                B{bin.binSequenceId}
              </div>
              <span className={isFull ? "font-bold" : "text-gray-400"}>
                {bin.currentBinStock}/{bin.maxBinStock}
              </span>
            </div>
          );
        })}
      </div>

    </div>
  );
}

export function BinPreview({ material }: BinPreviewProps) {
  if (!material) return <BinPreviewSkeleton />;

  if (material.packQuantity <= 0 || material.maxBinQty <= 0) {
    return (
      <div className="w-full min-w-[150px]">
        <div className="flex justify-between text-xs font-mono mb-1">
          <span className="text-gray-500">Preview...</span>
        </div>
        <div className="flex space-x-1 h-3">
          <div className="relative flex-1 h-full bg-gray-200 rounded-sm" />
        </div>
      </div>
    );
  }

  if (
    material.productType === "consumable" ||
    material.productType === "option"
  ) {
    return <MultiBinPreview material={material} />;
  }

  return <KanbanBinPreview material={material} />;
}