"use client";

interface BinPreviewProps {
  packQuantity: number;
  maxBinQty: number;
  minBinQty: number;
  currentQuantity?: number; 
}

export function BinPreview({
  packQuantity,
  maxBinQty,
  minBinQty,
  currentQuantity = 0,
}: BinPreviewProps) {
  
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

  const totalBins = Math.ceil(maxBinQty / packQuantity);
  const current = currentQuantity;
  const halfMaxQty = maxBinQty / 2;

  const reorderPoint = Math.max(minBinQty, packQuantity);

  let overallColorClass = "";
  if (current <= reorderPoint) {
    overallColorClass = "bg-red-500"; // Merah
  } else if (current > reorderPoint && current <= halfMaxQty) {
    overallColorClass = "bg-yellow-500"; // Kuning
  } else {
    overallColorClass = "bg-green-500"; // Hijau
  }

  if (current < 0 || current > maxBinQty) {
     overallColorClass = "bg-destructive";
  }

  const bins = Array.from({ length: totalBins }, (_, i) => i);

  return (
    <div className="w-full min-w-[150px]">
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className={`${(current < 0 || current > maxBinQty) ? "text-destructive font-bold" : ""}`}>
          Stok: {current} / {maxBinQty}
        </span>
        
        {/* --- PERUBAHAN DI SINI --- */}
        <span className="text-gray-500">
          (Min: {minBinQty}) (Pack: {packQuantity})
        </span>
        {/* --- AKHIR PERUBAHAN --- */}

      </div>

      <div className="flex space-x-1 h-3">
        {bins.map((index) => {
          const binStartQty = index * packQuantity;
          
          const isLastBin = index === totalBins - 1;
          const lastBinCapacity = maxBinQty - binStartQty;
          const binCapacity = (isLastBin && lastBinCapacity < packQuantity) ? lastBinCapacity : packQuantity;
          const binEndQty = binStartQty + binCapacity;

          let percent = 0;
          if (current >= binEndQty) {
            percent = 100;
          } else if (current > binStartQty) {
            const qtyInThisBin = current - binStartQty;
            percent = (qtyInThisBin / binCapacity) * 100; 
          }

          if (percent < 0) percent = 0;

          return (
            <div
              key={index}
              className="relative flex-1 h-full bg-gray-200 rounded-sm overflow-hidden"
            >
              {percent > 0 && (
                <div
                  className={`absolute top-0 left-0 h-full transition-all ${overallColorClass}`}
                  style={{ width: `${percent}%` }}
                />
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function BinPreviewSkeleton() {
  return (
    <div className="w-full min-w-[150px] animate-pulse">
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className="h-3 w-1/2 bg-gray-200 rounded"></span>
        <span className="h-3 w-1/4 bg-gray-200 rounded"></span>
      </div>
      <div className="flex space-x-1 h-3">
        <div className="flex-1 h-full bg-gray-200 rounded-sm" />
        <div className="flex-1 h-full bg-gray-200 rounded-sm" />
        <div className="flex-1 h-full bg-gray-200 rounded-sm" />
        <div className="flex-1 h-full bg-gray-200 rounded-sm" />
      </div>
    </div>
  );
}