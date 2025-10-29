"use client";

import { useState, useRef, KeyboardEvent, useEffect, useCallback } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Trash2 } from "lucide-react";

interface BinPreviewProps {
  packQuantity: number;
  maxBinQty: number;
  minBinQty: number;
  currentQuantity?: number; 
}

function BinPreview({
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
  if (current > maxBinQty) {
    overallColorClass = "bg-destructive";
  } else if (current >= maxBinQty) {
    overallColorClass = "bg-green-500";
  }
  if (current < 0) {
    overallColorClass = "bg-destructive";
  }


  const bins = Array.from({ length: totalBins }, (_, i) => i);

  return (
    <div className="w-full min-w-[150px]">
      <div className="flex justify-between text-xs font-mono mb-1">
        <span className={`${(current < 0 || current > maxBinQty) ? "text-destructive font-bold" : ""}`}>
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
          
          if (current < 0) percent = 100;

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

function BinPreviewSkeleton() {
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

const parseRawScan = (rawCode: string): { cleanCode: string | null; movement: "IN" | "OUT" | null; error: string | null } => {
  const code = rawCode.trim();
  
  if (code.toUpperCase().endsWith("_IN")) {
    const cleanCode = code.slice(0, -3); 
    if (cleanCode === "") return { cleanCode: null, movement: null, error: "Material ID kosong" };
    return { cleanCode, movement: "IN", error: null };
  }
  
  if (code.toUpperCase().endsWith("_OUT")) {
    const cleanCode = code.slice(0, -4); 
    if (cleanCode === "") return { cleanCode: null, movement: null, error: "Material ID kosong" };
    return { cleanCode, movement: "OUT", error: null };
  }
  
  if (code.length > 0 && !code.includes("_")) {
     return { cleanCode: code, movement: null, error: null }; 
  }
  
  if (code.length > 0) {
    return { cleanCode: null, movement: null, error: "Format salah (perlu _IN / _OUT)" };
  }
  
  return { cleanCode: null, movement: null, error: null };
};

type BinPreviewData = {
  packQuantity: number;
  maxBinQty: number;
  minBinQty: number;
  currentQuantity: number;
};

type ScanEntry = {
  id: number;
  materialCode: string; 
  status: "idle" | "loading" | "success" | "error";
  previewData: BinPreviewData | null;
  movementType: "IN" | "OUT" | null; 
  errorMessage: string | null;
};

interface ScanMaterialModalProps {
  setIsOpen: (open: boolean) => void;
  onScansSaved: () => void;
}

interface ApiStatusResponse {
  packQuantity: number;
  maxBinQty: number;
  minBinQty: number;
  currentQuantity: number;
}

const newEmptyScan = (): ScanEntry => ({
  id: Date.now(),
  materialCode: "", 
  status: "idle",
  previewData: null,
  movementType: null,
  errorMessage: null,
});

export function AutoScanMaterialModal({
  setIsOpen,
  onScansSaved,
}: ScanMaterialModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const authRole = "Admin"; 
  const [error, setError] = useState<string | null>(null);

  const [scans, setScans] = useState<ScanEntry[]>([newEmptyScan()]);
  const inputRefs = useRef<Map<number, HTMLInputElement | null>>(new Map());

  const validateAndFetchGroup = useCallback(
    async (rawMaterialCodeFromBlur: string) => {
      const blurParse = parseRawScan(rawMaterialCodeFromBlur.trim());

      if (blurParse.error) {
        setScans((prev) =>
          prev.map((s) =>
            s.materialCode.trim() === rawMaterialCodeFromBlur.trim()
              ? { ...s, status: "error", errorMessage: blurParse.error, movementType: null, previewData: null }
              : s
          )
        );
        return;
      }
      
      const cleanCodeToValidate = blurParse.cleanCode; 
      
      if (!cleanCodeToValidate) {
        setScans((prev) =>
          prev.map((s) =>
            s.materialCode.trim() === rawMaterialCodeFromBlur.trim()
              ? { ...s, status: "idle", errorMessage: null, movementType: null, previewData: null }
              : s
          )
        );
        return;
      }

      setScans((prev) =>
        prev.map((s) => {
          const rowParse = parseRawScan(s.materialCode);
          if (rowParse.cleanCode === cleanCodeToValidate) {
            return { ...s, status: "loading", errorMessage: null };
          }
          return s;
        })
      );

      let baseData: ApiStatusResponse;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/materials/status?code=${cleanCodeToValidate}`, 
          { headers: { "X-User-Role": authRole || "" } }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Material tidak ditemukan: ${cleanCodeToValidate}`);
        }
        baseData = await response.json(); 
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Gagal memuat";
        setScans((prev) =>
          prev.map((s) => {
            const rowParse = parseRawScan(s.materialCode);
            if (rowParse.cleanCode === cleanCodeToValidate) {
              return { ...s, status: "error", errorMessage: errorMessage, movementType: null, previewData: null };
            }
            return s;
          })
        );
        return;
      }

      let runningQuantity = baseData.currentQuantity;

      setScans((prev) => {
        return prev.map((scan) => {
          const rowParse = parseRawScan(scan.materialCode);
          
          if (rowParse.cleanCode !== cleanCodeToValidate) {
            return scan;
          }

          if (rowParse.error) {
             return {
              ...scan,
              status: "error",
              errorMessage: rowParse.error,
              movementType: null,
              previewData: null
            };
          }

          const { packQuantity, maxBinQty } = baseData;
          
          const movementType = rowParse.movement ? rowParse.movement : (runningQuantity >= maxBinQty ? "OUT" : "IN");

          let newQuantity = runningQuantity;
          let rowError: string | null = null;
          
          if (movementType === "IN") {
            newQuantity += packQuantity;
            if (newQuantity > maxBinQty) {
              rowError = `Stok melebihi Max (${newQuantity} / ${maxBinQty})`;
            }
          } else { 
            newQuantity -= packQuantity;
            if (newQuantity < 0) {
              rowError = `Stok kurang dari 0 (${newQuantity})`;
            }
          }
          
          runningQuantity = newQuantity; 

          const previewDataForRow: BinPreviewData = {
            ...baseData,
            currentQuantity: runningQuantity,
          };

          return {
            ...scan,
            status: rowError ? "error" : "success",
            previewData: previewDataForRow,
            movementType: movementType, 
            errorMessage: rowError,
          };
        });
      });
    },
    [authRole]
  );
  
  const [groupToRevalidate, setGroupToRevalidate] = useState<string | null>(
    null
  );

  useEffect(() => {
    if (groupToRevalidate) {
      validateAndFetchGroup(groupToRevalidate);
      setGroupToRevalidate(null);
    }
  }, [groupToRevalidate, validateAndFetchGroup]);

  const setInputRef = (id: number, element: HTMLInputElement | null) => {
    if (element) {
      inputRefs.current.set(id, element);
    } else {
      inputRefs.current.delete(id);
    }
  };

  const handleMaterialCodeChange = (id: number, newCode: string) => {
    setScans((prevScans) =>
      prevScans.map((scan) =>
        scan.id === id
          ? {
              ...scan,
              materialCode: newCode, 
              status: "idle",
              previewData: null,
              movementType: null,
              errorMessage: null,
            }
          : scan
      )
    );
  };

  const handleBlur = (id: number, materialCode: string) => {
    const scan = scans.find((s) => s.id === id);
    const code = materialCode.trim();
    if (scan?.status === "idle" || scan?.status === "error") {
      validateAndFetchGroup(code);
    }
  };

  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    currentId: number,
    currentIndex: number
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      if (currentIndex === scans.length - 1) {
        const currentScan = scans[currentIndex];
        if (currentScan.materialCode.trim() !== "") {
          e.preventDefault();
          setScans((prev) => [...prev, newEmptyScan()]);
        }
      }
    }
  };

  useEffect(() => {
    if (scans.length > 0) {
      const lastScan = scans[scans.length - 1];
      if (lastScan.materialCode === "" && lastScan.status === "idle") {
        setTimeout(() => {
          inputRefs.current.get(lastScan.id)?.focus();
        }, 0); 
      }
    }
  }, [scans.length]); 

  const handleDeleteScan = (id: number) => {
    const scanToDelete = scans.find((s) => s.id === id);
    const codeToRevalidate = parseRawScan(scanToDelete?.materialCode || "").cleanCode;

    setScans((prev) => {
      const newScans = prev.filter((scan) => scan.id !== id);
      if (newScans.length === 0) {
        return [newEmptyScan()];
      }
      return newScans;
    });

    if (codeToRevalidate) {
      const firstMatchingRaw = scans.find(s => s.id !== id && parseRawScan(s.materialCode).cleanCode === codeToRevalidate)?.materialCode;
      if(firstMatchingRaw) {
        setGroupToRevalidate(firstMatchingRaw);
      }
    }
  };

  const handleSubmit = async () => {
    const stillLoading = scans.some((s) => s.status === "loading");
    if (stillLoading) {
      setError("Harap tunggu semua validasi material selesai.");
      return;
    }

    const anyErrors = scans.some(s => s.status === "error" && s.materialCode.trim() !== "");
    if (anyErrors) {
      setError("Error: Terdapat baris dengan stok melebihi Max atau kurang dari 0. Harap perbaiki.");
      return;
    }

    const validScans = scans.filter(
      (s) => s.status === "success" && s.movementType
    );

    if (validScans.length === 0) {
      setError("Tidak ada data scan valid (status 'success') untuk disimpan.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload: string[] = validScans.map((s) => {
        const rowParse = parseRawScan(s.materialCode);
        
        if (rowParse.cleanCode && !rowParse.movement) {
          return `${rowParse.cleanCode}_${s.movementType}`; 
        }
        
        return s.materialCode.trim();
      });

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/materials/scan/auto`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": authRole || "", 
          },
          body: JSON.stringify(payload), 
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menyimpan scan.");
      }

      onScansSaved(); 
      setIsOpen(false); 
    } catch (error) {
      console.error("Error saving scans:", error);
      setError(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Scan Stok (Auto IN/OUT)</DialogTitle>
        <DialogDescription>
          Scan material (misal: "MAT-001_IN" atau "MAT-001"). 
          Jika suffix (_IN/_OUT) tidak ada, pergerakan akan diprediksi otomatis.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[60vh] overflow-y-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary">
            <TableRow>
              <TableHead className="w-[40px] pl-3">#</TableHead>
              <TableHead>Material ID (Scan)</TableHead>
              <TableHead className="min-w-[200px]">Pergerakan Stok</TableHead>
              <TableHead className="w-[50px] text-right">Hapus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.map((scan, index) => (
              <TableRow key={scan.id} className={`${scan.status === "error" ? "bg-destructive/10" : ""}`}>
                <TableCell className="p-1 pl-3 text-center text-sm text-muted-foreground align-top pt-3">
                  {index + 1}
                </TableCell>

                <TableCell className="p-1 align-top">
                  <Input
                    ref={(el) => setInputRef(scan.id, el)}
                    autoFocus={index === 0 && scans.length === 1} 
                    value={scan.materialCode} 
                    onChange={(e) =>
                      handleMaterialCodeChange(scan.id, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, scan.id, index)}
                    onBlur={(e) => handleBlur(scan.id, e.target.value)}
                    placeholder="Scan... (lalu Tab)"
                    className={`border-none !ring-0 !ring-offset-0 focus-visible:ring-1 p-2 h-auto bg-transparent ${
                      scan.status === "error" ? "text-destructive placeholder:text-destructive/60" : ""
                    }`}
                  />
                </TableCell>

                <TableCell className="p-2 align-top">
                  {scan.status === "loading" && <BinPreviewSkeleton />}
                  {scan.status === "success" && scan.previewData && (
                    <div>
                      <BinPreview {...scan.previewData} /> 
                      <span
                        className={`mt-1 block text-xs font-bold ${
                          scan.movementType === "IN"
                            ? "text-green-600"
                            : "text-red-600"
                        }`}
                      >
                        {scan.movementType === "IN"
                          ? "+1 Bin (IN)"
                          : "-1 Bin (OUT)"}
                      </span>
                    </div>
                  )}
                  {scan.status === "error" && (
                    <>
                      {scan.previewData && <BinPreview {...scan.previewData} />}
                      <span className="text-destructive font-bold text-xs mt-1 block">
                        {scan.errorMessage}
                      </span>
                    </>
                  )}
                  {scan.status === "idle" &&
                    scan.materialCode.trim() !== "" && (
                      <span className="text-gray-400 text-xs">
                        Keluar dari kolom untuk validasi...
                      </span>
                    )}
                </TableCell>

                <TableCell className="p-1 text-right align-top pt-2">
                  {(scans.length > 1 || scan.materialCode.trim() !== "") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 ${scan.status === "error" ? "text-destructive hover:bg-destructive/20" : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"}`}
                      onClick={() => handleDeleteScan(scan.id)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      {error && (
        <div className="bg-destructive/10 border border-destructive/50 text-destructive text-sm p-3 rounded-md text-center">
          {error}
        </div>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={isLoading}
        >
          {isLoading ? "Menyimpan..." : "Simpan Transaksi"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}