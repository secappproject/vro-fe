"use client";

import { useState, useRef, DragEvent } from "react";
import { Button } from "@/components/ui/button";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Progress } from "@/components/ui/progress";
import { useAuthStore } from "@/lib/types";
import Papa from "papaparse";
import { FileSpreadsheet, UploadCloud, X, Download } from "lucide-react";

interface ImportVendorStockModalProps {
  setIsOpen: (open: boolean) => void;
  onImportSuccess: () => void;
}

interface VendorStockPayload {
  materialCode: string;
  vendorStock: number;
  openPO: number;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function ImportVendorStockModal({
  setIsOpen,
  onImportSuccess,
}: ImportVendorStockModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validPayloads, setValidPayloads] = useState<VendorStockPayload[]>([]);
  
  const authRole = useAuthStore((state) => state.role);
  const authCompany = useAuthStore((state) => state.companyName);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | undefined) => {
    setError(null);
    setValidPayloads([]);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.type !== "text/csv" && !file.name.endsWith(".csv")) {
      setError("File harus berekstensi .csv");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(true); };
  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => { e.preventDefault(); setIsDragging(false); };
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidPayloads([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  
  const handleDownloadTemplate = () => {
    const headers = ["Material Code", "Vendor Stock", "Open PO"];
    
    const dummyData = "\nCONTOH-MAT-01,100,50"; 
    const csvContent = headers.join(",") + dummyData;
    
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template-supplier-stock.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  
  const handleAnalyze = () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setProgress("Menganalisis file...");
    setError(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        const fields = (results.meta.fields || []).map((f) => f.trim());
        
        
        const requiredHeaders = ["Material Code", "Vendor Stock", "Open PO"];
        const missingHeaders = requiredHeaders.filter(h => !fields.includes(h));

        if (missingHeaders.length > 0) {
          setError(`Header CSV salah. Wajib ada: ${missingHeaders.join(", ")}`);
          setIsLoading(false);
          return;
        }

        const payloads: VendorStockPayload[] = [];
        let errorRows = 0;

        data.forEach((row, index) => {
           const code = row["Material Code"]?.trim();
           if (!code) return; 

           const vStock = parseInt(row["Vendor Stock"]?.replace(/[,.]/g, "") || "0", 10);
           const openPO = parseInt(row["Open PO"]?.replace(/[,.]/g, "") || "0", 10);

           if (isNaN(vStock) || isNaN(openPO)) {
             errorRows++;
           } else {
             payloads.push({
               materialCode: code,
               vendorStock: vStock,
               openPO: openPO
             });
           }
        });

        if (payloads.length === 0) {
           setError("Tidak ada data valid yang ditemukan dalam file.");
        } else if (errorRows > 0) {
           alert(`Peringatan: Ada ${errorRows} baris dengan format angka yang salah dan akan dilewati.`);
        }

        setValidPayloads(payloads);
        setIsLoading(false);
        setProgress("");
      },
      error: (err) => {
        setError(`Gagal membaca file: ${err.message}`);
        setIsLoading(false);
      }
    });
  };

  
  const handleFinalImport = async () => {
    if (validPayloads.length === 0) return;

    setIsLoading(true);
    setProgress("Sedang mengupdate stok...");

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/bulk-stock`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "X-User-Role": authRole || "",
          "X-User-Company": authCompany || "",
        },
        body: JSON.stringify(validPayloads),
      });

      const json = await res.json();

      if (!res.ok) {
        throw new Error(json.error || "Gagal melakukan update.");
      }

      let message = `Berhasil update ${json.updatedCount} material.`;
      if (json.errors && json.errors.length > 0) {
        message += `\n\nGagal (${json.errors.length} item):\n` + json.errors.slice(0, 5).join("\n") + (json.errors.length > 5 ? "\n..." : "");
      }

      alert(message);
      onImportSuccess();
      setIsOpen(false);

    } catch (err) {
      setError(String(err));
    } finally {
      setIsLoading(false);
      setProgress("");
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Import Supplier Stock & Open PO</DialogTitle>
        <DialogDescription>
          Update stok vendor dan open PO secara massal via CSV.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        {}
        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2 w-full border-dashed"
          onClick={handleDownloadTemplate}
        >
          <Download  />
          Download Template CSV (Supplier)
        </Button>

        {}
        <Label
          htmlFor="csvFileVendor"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-gray-300 hover:bg-gray-50 dark:border-gray-600"
          } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="flex flex-col items-center p-2 text-center">
              <FileSpreadsheet className="w-8 h-8 text-green-600 mb-2" />
              <p className="font-medium text-sm truncate max-w-[200px]">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-6 text-red-500 hover:text-red-700"
                onClick={(e) => {
                  e.preventDefault();
                  handleRemoveFile();
                }}
              >
                <X className="w-3 h-3 mr-1" /> Ganti File
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">
                Klik atau tarik file CSV ke sini
              </p>
            </div>
          )}
          <Input
            id="csvFileVendor"
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            disabled={isLoading}
          />
        </Label>

        {}
        {error && (
          <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">
            {error}
          </div>
        )}

        {}
        {!error && validPayloads.length > 0 && (
          <div className="bg-green-50 text-green-700 p-3 rounded-md text-sm border border-green-200 flex items-center gap-2">
            <FileSpreadsheet className="w-4 h-4" />
            <span>Siap mengupdate <b>{validPayloads.length}</b> material.</span>
          </div>
        )}

        {}
        {isLoading && (
          <div className="space-y-2">
            <Progress value={100} className="h-2 animate-pulse" />
            <p className="text-xs text-center text-muted-foreground">{progress}</p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
          Tutup
        </Button>
        {validPayloads.length > 0 ? (
          <Button onClick={handleFinalImport} disabled={isLoading} className="bg-green-600 hover:bg-green-700">
            {isLoading ? "Memproses..." : "Update Stok Sekarang"}
          </Button>
        ) : (
          <Button onClick={handleAnalyze} disabled={!selectedFile || isLoading}>
            Analisis File
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}