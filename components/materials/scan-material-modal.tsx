"use client";

import { useState, useRef, KeyboardEvent, useEffect, useCallback } from "react";
import { useAuthStore } from "@/lib/types";
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
import { BinPreview, BinPreviewSkeleton } from "./bin-preview-movement";

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
  const authRole = useAuthStore((state) => state.role);
  const [error, setError] = useState<string | null>(null);

  const [scans, setScans] = useState<ScanEntry[]>([newEmptyScan()]);
  const inputRefs = useRef<Map<number, HTMLInputElement | null>>(new Map());

  const validateAndFetchGroup = useCallback(
    async (materialCode: string) => {
      if (!materialCode) return;

      setScans((prev) =>
        prev.map((s) =>
          s.materialCode.trim() === materialCode
            ? { ...s, status: "loading", errorMessage: null }
            : s
        )
      );

      let baseData: ApiStatusResponse;
      try {
        const response = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/materials/status?code=${materialCode}`,
          { headers: { "X-User-Role": authRole || "" } }
        );

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Material tidak ditemukan");
        }
        baseData = await response.json();
      } catch (error) {
        setScans((prev) =>
          prev.map((s) =>
            s.materialCode.trim() === materialCode
              ? {
                  ...s,
                  status: "error",
                  errorMessage:
                    error instanceof Error ? error.message : "Gagal memuat",
                }
              : s
          )
        );
        return;
      }

      let runningQuantity = baseData.currentQuantity;

      setScans((prev) => {
        return prev.map((scan) => {
          if (scan.materialCode.trim() !== materialCode) {
            return scan;
          }

          const { packQuantity, maxBinQty } = baseData;

          const predictedMovement =
            runningQuantity >= maxBinQty ? "OUT" : "IN";

          if (predictedMovement === "IN") {
            runningQuantity += packQuantity;
          } else {
            runningQuantity -= packQuantity;
          }

          const previewDataForRow: BinPreviewData = {
            ...baseData,
            currentQuantity: runningQuantity, 
          };

          return {
            ...scan,
            status: "success",
            previewData: previewDataForRow, 
            movementType: predictedMovement,
            errorMessage: null,
          };
        });
      });
    },
    [authRole]
  );
  const [groupToRevalidate, setGroupToRevalidate] = useState<string | null>(null);

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
    if (code !== "" && (scan?.status === "idle" || scan?.status === "error")) {
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
    const codeToRevalidate = scanToDelete?.materialCode.trim();

    setScans((prev) => {
      const newScans = prev.filter((scan) => scan.id !== id);
      if (newScans.length === 0) {
        return [newEmptyScan()];
      }
      return newScans;
    });

    if (codeToRevalidate) {
      setGroupToRevalidate(codeToRevalidate);
    }
  };

  const handleSubmit = async () => {
    const codesToSubmit = scans
      .filter((s) => s.materialCode.trim() !== "" && s.status !== 'error')
      .map((s) => s.materialCode.trim());

    if (codesToSubmit.length === 0) {
      alert("Tidak ada data scan valid untuk disimpan.");
      return;
    }
    
    const stillLoading = scans.some(s => s.status === 'loading');
    if (stillLoading) {
      alert("Harap tunggu semua validasi material selesai.");
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const payload: string[] = codesToSubmit;

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
        <DialogTitle>Scan Stok (Otomatis IN/OUT)</DialogTitle>
        <DialogDescription>
          Scan material. Status akan divalidasi otomatis secara berurutan.
          Tekan "Tab" di baris terakhir untuk menambah baris baru.
        </DialogDescription>
      </DialogHeader>

      <div className="max-h-[60vh] overflow-y-auto border rounded-md">
        <Table>
          <TableHeader className="sticky top-0 bg-secondary">
            <TableRow>
              <TableHead className="w-[40px] pl-3">#</TableHead>
              <TableHead>Material ID</TableHead>
              <TableHead className="min-w-[200px]">Pergerakan Stok</TableHead>
              <TableHead className="w-[50px] text-right">Hapus</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {scans.map((scan, index) => (
              <TableRow key={scan.id}>
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
                    className={`border-none !ring-0 !ring-offset-0 focus-visible:ring-1 focus-visible:ring-ring p-2 h-auto ${
                      scan.status === 'error' ? 'text-destructive' : ''
                    }`}
                  />
                </TableCell>
                
                <TableCell className="p-2 align-top">
                  {scan.status === 'loading' && (
                    <BinPreviewSkeleton />
                  )}
                  {scan.status === 'success' && scan.previewData && (
                    <div>
                      <BinPreview {...scan.previewData} />
                      <span className={`mt-1 block text-xs font-bold ${
                        scan.movementType === 'IN' ? 'text-green-600' : 'text-red-600'
                      }`}>
                        {scan.movementType === 'IN' ? '+1 Bin (IN)' : '-1 Bin (OUT)'}
                      </span>
                    </div>
                  )}
                  {scan.status === 'error' && (
                    <span className="text-red-600 text-xs">{scan.errorMessage}</span>
                  )}
                  {scan.status === 'idle' && scan.materialCode.trim() !== '' && (
                     <span className="text-gray-400 text-xs">Keluar dari kolom untuk validasi...</span>
                  )}
                </TableCell>
                
                <TableCell className="p-1 text-right align-top pt-2">
                  {(scans.length > 1 || scan.materialCode.trim() !== "") && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 w-8 p-0 text-destructive hover:bg-destructive/10"
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
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button
          onClick={handleSubmit}
          disabled={
            isLoading || scans.every((s) => s.status !== 'success')
          }
        >
          {isLoading ? "Menyimpan..." : "Simpan Transaksi"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}