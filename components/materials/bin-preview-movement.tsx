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
  
  if (
    packQuantity <= 0 ||
    maxBinQty <= 0 ||
    maxBinQty % packQuantity !== 0
  ) {
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

  const totalBins = maxBinQty / packQuantity;
  const current = currentQuantity;
  const reorderPoint = Math.max(minBinQty, packQuantity);

  let overallColorClass = "bg-yellow-500"; 
  if (current <= reorderPoint) {
    overallColorClass = "bg-red-500"; 
  }
  if (current >= maxBinQty) {
    overallColorClass = "bg-green-500";
  }

  const bins = Array.from({ length: totalBins }, (_, i) => i);

  return (
    <div className="w-full min-w-[150px]">
      <div className="flex justify-between text-xs font-mono mb-1">
        <span>
          Stok: {current} / {maxBinQty}
        </span>
        <span className="text-gray-500">{totalBins} bin</span>
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