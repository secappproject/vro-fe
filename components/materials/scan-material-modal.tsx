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
import { Label } from "../ui/label";
import { MaterialBin } from "@/lib/types"; // <-- Import MaterialBin

// --- Komponen BinPreview BARU (Berbasis Segmen) ---
interface BinPreviewProps {
  baseData: ApiStatusResponse; // Menggunakan ApiStatusResponse
  simulatedBins: Map<number, number>; // Menggunakan map simulasi
  simulatedTotal: number;
}

function BinPreview({ baseData, simulatedBins, simulatedTotal }: BinPreviewProps) {
  const {
    productType,
    maxBinQty,
    minBinQty,
    packQuantity,
    quantityPerBin,
  } = baseData;

  let totalBinSegments = 0;
  let qtyPerSegment = 0;

  if (productType === "kanban") {
    if (packQuantity <= 0) return <BinPreviewSkeleton />;
    qtyPerSegment = packQuantity;
    totalBinSegments = maxBinQty / packQuantity;
  } else {
    // Untuk Consumable/Option, gunakan data dari bins
    if (!baseData.bins || baseData.bins.length === 0) return <BinPreviewSkeleton />;
    qtyPerSegment = quantityPerBin;
    totalBinSegments = baseData.bins.length;
  }

  if (totalBinSegments === 0 || qtyPerSegment <= 0) {
    return <BinPreviewSkeleton />;
  }
  
  const current = simulatedTotal;
  const shortagePoint = Math.ceil(maxBinQty * 0.3);
  const preshortagePoint = Math.ceil(maxBinQty * 0.6);

  let overallColorClass = "bg-green-500";
  if (current <= shortagePoint) overallColorClass = "bg-red-500";
  else if (current <= preshortagePoint) overallColorClass = "bg-yellow-500";
  
  if (current < 0 || current > maxBinQty) overallColorClass = "bg-destructive";

  const binIds =
    productType === "kanban"
      ? Array.from({ length: totalBinSegments }, (_, i) => i + 1)
      : baseData.bins!.map((b) => b.binSequenceId);

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
        <span className="text-gray-500">{totalBinSegments} bin</span>
      </div>

      <div className="flex space-x-1 h-3">
        {binIds.map((binId, index) => {
          let percent = 0;
          if (productType === "kanban") {
            const binStartQty = index * qtyPerSegment;
            const binEndQty = (index + 1) * qtyPerSegment;
            if (current >= binEndQty) percent = 100;
            else if (current > binStartQty) {
              percent = ((current - binStartQty) / qtyPerSegment) * 100;
            }
          } else {
            // Consumable / Option
            const binStock = simulatedBins.get(binId) || 0;
            percent = (binStock / qtyPerSegment) * 100;
          }
          if (current < 0) percent = 100; // Tampilkan error over-empty

          return (
            <div
              key={binId}
              className="relative flex-1 h-full bg-gray-200 rounded-sm overflow-hidden"
              title={`Bin ${binId}`}
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
    </div>
  );
}

// ... (BinPreviewSkeleton tidak berubah) ...
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

// ... (ParsedScan, ScanFormat... tidak berubah) ...
type ScanFormat = "IN" | "OUT_DEFAULT" | "OUT_EXPLICIT";

interface ParsedScan {
  raw: string;
  materialCode: string | null;
  binId: number | null;
  movement: "IN" | "OUT" | null;
  quantity: number | null; 
  format: ScanFormat | null;
  error: string | null;
}

const parseRawScan = (rawCode: string): ParsedScan => {
  const code = rawCode.trim();
  const parts = code.split("_");
  const len = parts.length;

  if (len < 3) {
    if (code === "")
      return { raw: code, materialCode: null, binId: null, movement: null, quantity: null, format: null, error: null };
    return { raw: code, materialCode: parts[0], binId: null, movement: null, quantity: null, format: null, error: "Format scan tidak lengkap (cth: MAT_IN_1)" };
  }

  const materialCode = parts[0];
  const movement = parts[1].toUpperCase();
  const binIdStr = parts[2];
  const binId = parseInt(binIdStr, 10);

  if (isNaN(binId) || binId <= 0) {
    return { raw: code, materialCode: materialCode, binId: null, movement: null, quantity: null, format: null, error: `Bin ID salah: ${binIdStr}` };
  }
  
  if (movement === "IN") {
    if (len > 3) return { raw: code, materialCode: materialCode, binId: binId, movement: "IN", quantity: null, format: null, error: "Format IN tidak perlu Qty (cth: MAT_IN_1)" };
    return { raw: code, materialCode: materialCode, binId: binId, movement: "IN", quantity: null, format: "IN", error: null };
  }

  if (movement === "OUT") {
    if (len === 3) {
      // MAT_OUT_1
      return { raw: code, materialCode: materialCode, binId: binId, movement: "OUT", quantity: null, format: "OUT_DEFAULT", error: null };
    }
    if (len === 4) {
      // MAT_OUT_1_10
      const qtyStr = parts[3];
      const quantity = parseInt(qtyStr, 10);
      if (isNaN(quantity) || quantity <= 0) {
        return { raw: code, materialCode: materialCode, binId: binId, movement: "OUT", quantity: null, format: "OUT_EXPLICIT", error: `Qty salah: ${qtyStr}` };
      }
      return { raw: code, materialCode: materialCode, binId: binId, movement: "OUT", quantity: quantity, format: "OUT_EXPLICIT", error: null };
    }
    return { raw: code, materialCode: materialCode, binId: binId, movement: "OUT", quantity: null, format: null, error: "Format OUT salah (cth: MAT_OUT_1 atau MAT_OUT_1_10)" };
  }
  
  return { raw: code, materialCode: materialCode, binId: null, movement: null, quantity: null, format: null, error: `Movement salah: ${movement} (perlu IN atau OUT)` };
};


// --- ScanEntry diubah untuk menyimpan data bin ---
type ScanEntry = {
  id: number;
  rawScan: string;
  status: "idle" | "loading" | "success" | "error";
  
  // Data statis dari API
  baseData: ApiStatusResponse | null;
  // Data simulasi yang diupdate per baris
  simulatedBins: Map<number, number>; 
  simulatedTotal: number;

  predictedMovement: "IN" | "OUT" | null;
  predictedBinId: number | null;
  predictedQtyPcs: number | null;
  
  showQtyInput: boolean;
  qtyInputLabel: "Packs" | "PCS" | null;
  inputQty: string;
  
  finalRawScan: string;
  errorMessage: string | null;
  parsed: ParsedScan;
};

interface ScanMaterialModalProps {
  setIsOpen: (open: boolean) => void;
  onScansSaved: () => void;
}

// --- Interface API Response diperbarui ---
interface ApiStatusResponse {
  packQuantity: number;
  maxBinQty: number;
  minBinQty: number;
  currentQuantity: number;
  productType: "kanban" | "consumable" | "option";
  quantityPerBin: number;
  bins: MaterialBin[] | null; // <-- WAJIB ADA
}

const newEmptyScan = (): ScanEntry => ({
  id: Date.now(),
  rawScan: "",
  status: "idle",
  baseData: null,
  simulatedBins: new Map<number, number>(),
  simulatedTotal: 0,
  predictedMovement: null,
  predictedBinId: null,
  predictedQtyPcs: null,
  showQtyInput: false,
  qtyInputLabel: null,
  inputQty: "1",
  finalRawScan: "",
  errorMessage: null,
  parsed: parseRawScan(""),
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
    async (materialCodeToValidate: string) => {
      
      setScans((prev) =>
        prev.map((s) => {
          if (s.parsed.materialCode === materialCodeToValidate) {
            return { ...s, status: "loading", errorMessage: null };
          }
          return s;
        })
      );

      let baseData: ApiStatusResponse;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/materials/status?code=${materialCodeToValidate}`,
          { headers: { "X-User-Role": authRole || "" } }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || `Material tidak ditemukan: ${materialCodeToValidate}`);
        }
        
        baseData = await response.json();
        
        // --- VALIDASI DATA DARI API ---
        if (baseData.productType !== 'kanban' && (!baseData.bins)) {
           throw new Error(`Data bin tidak lengkap dari API untuk ${materialCodeToValidate}`);
        }
        if (baseData.productType === 'kanban' && !baseData.quantityPerBin) {
            baseData.quantityPerBin = baseData.packQuantity;
        }
        // ---------------------

      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "Gagal memuat";
        setScans((prev) =>
          prev.map((s) => {
            if (s.parsed.materialCode === materialCodeToValidate) {
              return { ...s, status: "error", errorMessage: errorMessage, baseData: null };
            }
            return s;
          })
        );
        return;
      }

      // --- INISIALISASI SIMULASI ---
      let runningQuantity = baseData.currentQuantity;
      const simulatedBins = new Map<number, number>();
      if (baseData.bins) {
        baseData.bins.forEach(b => {
          simulatedBins.set(b.binSequenceId, b.currentBinStock);
        });
      }
      // -----------------------------

      setScans((prev) => {
        return prev.map((scan) => {
          if (scan.parsed.materialCode !== materialCodeToValidate) {
            return scan;
          }

          const { productType, packQuantity, maxBinQty, quantityPerBin } = baseData;
          let parsed = scan.parsed;
          let rowError: string | null = parsed.error;

          let predictedMovement = parsed.movement;
          let predictedBinId = parsed.binId;
          let predictedQtyPcs: number | null = null;
          let inputQty: string = scan.inputQty; // Ambil dari state (default 1)
          let showQtyInput: boolean = false;
          let qtyInputLabel: "Packs" | "PCS" | null = null;
          let finalRawScan: string = scan.rawScan; 

          if (!rowError && parsed.format) {
            if (parsed.format === "IN") {
              predictedQtyPcs = quantityPerBin;
              finalRawScan = scan.rawScan;
            
            } else if (parsed.format === "OUT_DEFAULT") {
              // Jika inputQty masih "1" (default), set ulang
              if (scan.inputQty === "1") inputQty = "1"; 
              
              if (productType === "kanban") {
                predictedQtyPcs = quantityPerBin; // (qtyPerBin == packQuantity)
                finalRawScan = scan.rawScan;
              } else if (productType === "consumable") {
                showQtyInput = true;
                qtyInputLabel = "Packs";
                predictedQtyPcs = parseInt(inputQty, 10) * packQuantity;
                finalRawScan = `${parsed.materialCode}_OUT_${parsed.binId}_${inputQty}`;
              } else if (productType === "option") {
                showQtyInput = true;
                qtyInputLabel = "PCS";
                predictedQtyPcs = parseInt(inputQty, 10);
                finalRawScan = `${parsed.materialCode}_OUT_${parsed.binId}_${inputQty}`;
              }
            } else if (parsed.format === "OUT_EXPLICIT") {
              const explicitQty = parsed.quantity!;
              inputQty = String(explicitQty); // Set inputQty dari scan
              finalRawScan = scan.rawScan;
              
              if (productType === "kanban") {
                rowError = "Format 4-bagian (dgn Qty) tidak valid untuk Kanban.";
              } else if (productType === "consumable") {
                showQtyInput = true;
                qtyInputLabel = "Packs";
                predictedQtyPcs = explicitQty * packQuantity;
              } else if (productType === "option") {
                showQtyInput = true;
                qtyInputLabel = "PCS";
                predictedQtyPcs = explicitQty;
              }
            }
          }

          // --- Kalkulasi & Validasi Stok Berjalan (DENGAN BIN) ---
          let newTotalQuantity = runningQuantity;
          if (!rowError && predictedQtyPcs !== null && predictedBinId !== null) {
            if (predictedMovement === "IN") {
              if (productType !== "kanban") {
                const currentBinStock = simulatedBins.get(predictedBinId) || 0;
                if (currentBinStock > 0) {
                  rowError = `Bin ${predictedBinId} sudah terisi (stok: ${currentBinStock})`;
                }
              }
              
              if (!rowError) {
                newTotalQuantity += predictedQtyPcs;
                if (newTotalQuantity > maxBinQty) {
                  rowError = `Stok melebihi Max (${newTotalQuantity} / ${maxBinQty})`;
                } else {
                  // Sukses: Update simulasi
                  runningQuantity = newTotalQuantity;
                  if (productType !== "kanban") {
                    simulatedBins.set(predictedBinId, predictedQtyPcs);
                  }
                }
              }
            } else { // OUT
              if (productType === "kanban") {
                 newTotalQuantity -= predictedQtyPcs;
                 if (newTotalQuantity < 0) {
                   rowError = `Stok kurang dari 0 (${newTotalQuantity})`;
                 } else {
                   runningQuantity = newTotalQuantity; // Sukses
                 }
              } else {
                const currentBinStock = simulatedBins.get(predictedBinId) || 0;
                if (currentBinStock === 0) {
                  rowError = `Bin ${predictedBinId} sudah kosong`;
                } else if (currentBinStock < predictedQtyPcs) {
                   rowError = `Stok Bin ${predictedBinId} kurang (sisa ${currentBinStock}, butuh ${predictedQtyPcs})`;
                }
                
                if (!rowError) {
                   newTotalQuantity -= predictedQtyPcs;
                   runningQuantity = newTotalQuantity;
                   simulatedBins.set(predictedBinId, currentBinStock - predictedQtyPcs); // Update simulasi
                }
              }
            }
          }

          return {
            ...scan,
            status: rowError ? "error" : "success",
            baseData: baseData, // Simpan data asli
            // Buat snapshot dari simulasi untuk baris ini
            simulatedBins: new Map(simulatedBins),
            simulatedTotal: runningQuantity,
            predictedMovement,
            predictedBinId,
            predictedQtyPcs,
            showQtyInput,
            qtyInputLabel,
            inputQty: rowError ? scan.inputQty : inputQty, // Tampilkan inputQty
            finalRawScan: rowError ? "" : finalRawScan,
            errorMessage: rowError,
          };
        });
      });
    },
    [authRole] // Hapus 'scans' dari dependency array
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
              ...newEmptyScan(),
              id: scan.id,
              rawScan: newCode,
              parsed: parseRawScan(newCode),
            }
          : scan
      )
    );
  };
  const handleQtyChange = (id: number, newQtyStr: string) => {
     setScans(prevScans => 
       prevScans.map(scan => {
         if(scan.id !== id || !scan.showQtyInput) {
           return scan;
         }

         const newQty = parseInt(newQtyStr, 10);
         const qtyValue = isNaN(newQty) ? 0 : newQty;
         
         let newPredictedQtyPcs = 0;
         // Ambil data dari baseData yang tersimpan di state
         if (scan.baseData) { 
           const { productType, packQuantity } = scan.baseData;
           if (productType === 'consumable') {
              newPredictedQtyPcs = qtyValue * packQuantity;
           } else if (productType === 'option') {
              newPredictedQtyPcs = qtyValue;
           }
         }
         
         const newFinalRawScan = `${scan.parsed.materialCode}_OUT_${scan.parsed.binId}_${qtyValue <= 0 ? "" : qtyValue}`;

         return {
           ...scan,
           inputQty: newQtyStr, // Simpan string (bisa jadi "0" atau "")
           finalRawScan: newFinalRawScan,
           predictedQtyPcs: newPredictedQtyPcs, // Update PCS untuk getMovementText
           // JANGAN UBAH STATUS DI SINI
           // status: "idle", <-- INI SUMBER MASALAHNYA
         }
       })
     );
  }

  const handleBlur = (id: number) => {
    const scan = scans.find((s) => s.id === id);
    if (!scan) return;

    let codeToRevalidate = scan.parsed.materialCode;
    let newRawScan = scan.rawScan; // Default
    let needsStateUpdate = false;

    // Cek apakah ini blur dari input Qty?
    // Kita bisa tahu jika showQtyInput == true DAN inputQty baru saja diubah
    if (scan.showQtyInput) {
       const qtyNum = parseInt(scan.inputQty, 10);
       if(isNaN(qtyNum) || qtyNum <= 0) {
          // Jika qty tidak valid, set error & HENTIKAN revalidasi
          setScans(prev => prev.map(s => s.id === id ? { ...s, status: "error", errorMessage: "Qty tidak valid", baseData: null } : s));
          return; 
       }
       // Qty valid, update rawScan agar sinkron
       newRawScan = `${scan.parsed.materialCode}_OUT_${scan.parsed.binId}_${qtyNum}`;
    }

    const reParsed = parseRawScan(newRawScan);
    
    // Cek apakah state perlu disinkronkan sebelum revalidasi
    if (scan.rawScan !== newRawScan || scan.parsed.error !== reParsed.error) {
        needsStateUpdate = true;
    }
    codeToRevalidate = reParsed.materialCode;


    if (codeToRevalidate) {
      if (needsStateUpdate) {
        // Sinkronkan state dulu, JANGAN set status idle
        setScans(prev => prev.map(s => s.id === id ? {...s, rawScan: newRawScan, parsed: reParsed } : s));
      }
      // Langsung picu revalidasi
      setGroupToRevalidate(codeToRevalidate);
    }
  };
  const handleKeyDown = (
    e: KeyboardEvent<HTMLInputElement>,
    currentId: number,
    currentIndex: number
  ) => {
    if (e.key === "Tab" && !e.shiftKey) {
      // Cek jika fokus ada di input Qty, jangan tambah baris baru
      if ((e.target as HTMLElement).id.startsWith("qty-")) {
        return; 
      }
      
      if (currentIndex === scans.length - 1) {
        const currentScan = scans[currentIndex];
        if (currentScan.rawScan.trim() !== "") {
          e.preventDefault();
          setScans((prev) => [...prev, newEmptyScan()]);
        }
      }
    }
  };

  useEffect(() => {
     if (scans.length > 0) {
      const lastScan = scans[scans.length - 1];
      if (lastScan.rawScan === "" && lastScan.status === "idle") {
        setTimeout(() => {
          inputRefs.current.get(lastScan.id)?.focus();
        }, 0);
      }
    }
  }, [scans.length]);

  const handleDeleteScan = (id: number) => {
    const scanToDelete = scans.find((s) => s.id === id);
    const codeToRevalidate = scanToDelete?.parsed.materialCode;

    setScans((prev) => {
      const newScans = prev.filter((scan) => scan.id !== id);
      if (newScans.length === 0) {
        return [newEmptyScan()];
      }
      return newScans;
    });

    if (codeToRevalidate) {
      // Cek apakah masih ada scan lain dengan material code yg sama
      const needsRevalidation = scans.some(s => s.id !== id && s.parsed.materialCode === codeToRevalidate);
      if(needsRevalidation) {
        setGroupToRevalidate(codeToRevalidate);
      }
    }
  };

  const handleSubmit = async () => {
    const stillLoading = scans.some((s) => s.status === "loading");
    if (stillLoading) {
      setError("Harap tunggu semua validasi material selesai.");
      return;
    }

    const anyErrors = scans.some(s => s.status === "error" && s.rawScan.trim() !== "");
    if (anyErrors) {
      setError("Error: Terdapat baris dengan error. Harap perbaiki atau hapus.");
      return;
    }
    
    const invalidQty = scans.some(s => s.showQtyInput && (s.inputQty === "" || parseInt(s.inputQty, 10) <= 0));
    if (invalidQty) {
      setError("Error: Kuantitas (Packs/PCS) harus diisi dan lebih dari 0.");
      return;
    }


    const validScans = scans.filter(
      (s) => s.status === "success" && s.predictedMovement && s.finalRawScan
    );

    if (validScans.length === 0) {
      setError("Tidak ada data scan valid (status 'success') untuk disimpan.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload: string[] = validScans.map((s) => s.finalRawScan.trim());
      
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
  
  const getMovementText = (scan: ScanEntry) => {
    if (scan.status !== 'success') return null;
    
    const { predictedMovement, predictedQtyPcs, predictedBinId } = scan;

    if (predictedMovement === 'IN') {
       return `+${predictedQtyPcs} pcs (IN, Bin ${predictedBinId || '?'})`;
    }
    
    return `-${predictedQtyPcs} pcs (OUT, Bin ${predictedBinId || '?'})`;
  }

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Scan Stok (Auto IN/OUT)</DialogTitle>
        <DialogDescription>
          Scan: [Material]_IN_[Bin] | [Material]_OUT_[Bin] | [Material]_OUT_[Bin]_[Qty]
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
              <TableRow
                key={scan.id}
                className={`${
                  scan.status === "error" ? "bg-destructive/10" : ""
                }`}
              >
                <TableCell className="p-1 pl-3 text-center text-sm text-muted-foreground align-top pt-3">
                  {index + 1}
                </TableCell>

                <TableCell className="p-1 align-top">
                  <Input
                    ref={(el) => setInputRef(scan.id, el)}
                    autoFocus={index === 0 && scans.length === 1}
                    value={scan.rawScan}
                    onChange={(e) =>
                      handleMaterialCodeChange(scan.id, e.target.value)
                    }
                    onKeyDown={(e) => handleKeyDown(e, scan.id, index)}
                    onBlur={() => handleBlur(scan.id)}
                    placeholder="Scan... (lalu Tab)"
                    className={`border-none !ring-0 !ring-offset-0 focus-visible:ring-1 p-2 h-auto bg-transparent ${
                      scan.status === "error"
                        ? "text-destructive placeholder:text-destructive/60"
                        : ""
                    }`}
                  />
                </TableCell>

                <TableCell className="p-2 align-top">
                  {scan.status === "loading" && <BinPreviewSkeleton />}
                  {scan.status === "success" && scan.baseData && (
                    <div>
                      <BinPreview 
                        baseData={scan.baseData}
                        simulatedBins={scan.simulatedBins}
                        simulatedTotal={scan.simulatedTotal}
                      />
                      <div className="mt-2 flex items-center gap-2">
                         <span
                          className={`flex-1 text-xs font-bold ${
                            scan.predictedMovement === "IN"
                              ? "text-green-600"
                              : "text-red-600"
                          }`}
                        >
                         {getMovementText(scan)}
                        </span>
                        {scan.showQtyInput && (
                           <div className="space-y-1">
                             <Label htmlFor={`qty-${scan.id}`} className="text-xs">
                               Qty ({scan.qtyInputLabel})
                             </Label>
                             <Input
                               id={`qty-${scan.id}`}
                               type="number"
                               value={scan.inputQty}
                               onChange={e => handleQtyChange(scan.id, e.target.value)}
                               onKeyDown={(e) => handleKeyDown(e, scan.id, index)}
                               onBlur={() => handleBlur(scan.id)}
                               className="h-8 w-24 text-sm"
                               placeholder="Qty"
                               min="1"
                             />
                           </div>
                        )}
                      </div>
                    </div>
                  )}
                  {scan.status === "error" && (
                    <>
                      {scan.baseData && (
                         <BinPreview 
                          baseData={scan.baseData}
                          simulatedBins={scan.simulatedBins}
                          simulatedTotal={scan.simulatedTotal}
                        />
                      )}
                      <span className="text-destructive font-bold text-xs mt-1 block">
                        {scan.errorMessage}
                      </span>
                    </>
                  )}
                  {scan.status === "idle" &&
                    scan.rawScan.trim() !== "" && !scan.parsed.error && (
                      <span className="text-gray-400 text-xs">
                        Keluar dari kolom untuk validasi...
                      </span>
                    )}
                   {scan.status === "idle" && scan.parsed.error && (
                     <span className="text-destructive font-bold text-xs mt-1 block">
                        {scan.parsed.error}
                      </span>
                   )}
                </TableCell>

                <TableCell className="p-1 text-right align-top pt-2">
                  {(scans.length > 1 || scan.rawScan.trim() !== "") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className={`h-8 w-8 p-0 ${
                        scan.status === "error"
                          ? "text-destructive hover:bg-destructive/20"
                          : "text-muted-foreground hover:bg-destructive/10 hover:text-destructive"
                      }`}
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
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan Transaksi"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}