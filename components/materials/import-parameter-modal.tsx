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
import { FileSpreadsheet, UploadCloud, X, Download, Check, Square } from "lucide-react";

interface ImportParameterModalProps {
  setIsOpen: (open: boolean) => void;
  onImportSuccess: () => void;
}

interface ParameterPayload {
  materialCode: string;
  amu?: number;
  fmrs?: string; // FMRS biasanya kategori string (F, M, R, atau S)
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

export function ImportParameterModal({
  setIsOpen,
  onImportSuccess,
}: ImportParameterModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validPayloads, setValidPayloads] = useState<ParameterPayload[]>([]);
  
  const [overwriteBlank, setOverwriteBlank] = useState(false);
  
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
  const headers = ["Material Code", "AMU", "FMRS"];
  const csvContent = headers.join(","); 
  const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
  const link = document.createElement("a");
  link.href = URL.createObjectURL(blob);
  link.download = `template-parameter-amu-fmrs.csv`;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
  
  const handleAnalyze = () => {
    if (!selectedFile) return;

    setIsLoading(true);
    setProgress("Menganalisis data parameter...");
    setError(null);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        const data = results.data as Record<string, string>[];
        const fields = (results.meta.fields || []).map((f) => f.trim());
        
        const requiredHeaders = ["Material Code", "AMU", "FMRS"];
        const missingHeaders = requiredHeaders.filter(h => !fields.includes(h));

        if (missingHeaders.length > 0) {
          setError(`Header CSV tidak lengkap. Wajib ada: ${missingHeaders.join(", ")}`);
          setIsLoading(false);
          return;
        }

        const payloads: ParameterPayload[] = [];
        let errorRows = 0;

        data.forEach((row) => {
           const code = row["Material Code"]?.trim();
           if (!code) return; 

           const rawAMU = row["AMU"]?.trim();
           const rawFMRS = row["FMRS"]?.trim()?.toUpperCase();

           let amuValue: number | undefined;
           let fmrsValue: string | undefined;

           // Logic untuk AMU (Numeric)
           if (!rawAMU) {
               amuValue = overwriteBlank ? 0 : undefined;
           } else {
               const parsed = parseFloat(rawAMU.replace(/[,]/g, ""));
               if (isNaN(parsed)) {
                   errorRows++;
                   return;
               }
               amuValue = parsed;
           }

           // Logic untuk FMRS (String)
           if (!rawFMRS) {
               fmrsValue = overwriteBlank ? "" : undefined;
           } else {
               fmrsValue = rawFMRS;
           }

           if (amuValue !== undefined || fmrsValue !== undefined) {
               payloads.push({
                   materialCode: code,
                   amu: amuValue,
                   fmrs: fmrsValue
               });
           }
        });

        if (payloads.length === 0) {
           setError("Tidak ada data valid untuk diimport.");
        } else if (errorRows > 0) {
           alert(`Peringatan: Ada ${errorRows} baris dengan format AMU salah dan akan dilewati.`);
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
  setProgress("Mengupdate parameter AMU & FMRS...");

  try {
    const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/bulk-parameters`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-User-Role": authRole || "",
        "X-User-Company": authCompany || "",
      },
      body: JSON.stringify(validPayloads),
    });

    const contentType = res.headers.get("content-type");
    
    if (contentType && contentType.includes("application/json")) {
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Gagal update parameter.");
      alert(`Berhasil update ${json.updatedCount || 0} data parameter.`);
    } else {
      // Jika Backend kirim teks biasa (plain text)
      const text = await res.text();
      if (!res.ok) throw new Error(text || "Gagal update parameter.");
      alert("Berhasil update data parameter.");
    }

    onImportSuccess();
    setIsOpen(false);

  } catch (err: any) {
    // Tampilkan error aslinya di UI
    setError(err.message || String(err));
  } finally {
    setIsLoading(false);
    setProgress("");
  }
};

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Import Parameter (AMU & FMRS)</DialogTitle>
        <DialogDescription>
          Update Average Monthly Usage dan kategori FMRS melalui file CSV.
        </DialogDescription>
      </DialogHeader>

      <div className="grid gap-4 py-4">
        <div className="flex items-center space-x-2 border p-3 rounded-md bg-gray-50 dark:bg-gray-900/50">
          <button 
              type="button"
              onClick={() => setOverwriteBlank(!overwriteBlank)}
              className="flex items-center justify-center w-5 h-5 focus:outline-none"
          >
              {overwriteBlank ? (
                  <div className="flex items-center justify-center w-5 h-5 text-white bg-blue-600 rounded-sm">
                      <Check className="w-4 h-4" />
                  </div>
              ) : (
                  <Square className="w-5 h-5 text-gray-400" />
              )}
          </button>
          <div className="space-y-1 cursor-pointer" onClick={() => setOverwriteBlank(!overwriteBlank)}>
              <Label className="cursor-pointer font-regular">Timpa data kosong</Label>
              <p className="text-[10px] text-muted-foreground leading-tight">
                  Jika dicentang: Kolom kosong di CSV akan menghapus data lama (set ke 0/empty).
              </p>
          </div>
        </div>

        <Button
          type="button"
          variant="outline"
          className="flex items-center gap-2 w-full border-dashed"
          onClick={handleDownloadTemplate}
        >
          <Download className="h-4 w-4" />
          Download Template Parameter
        </Button>

        <Label
          htmlFor="csvFileParameter"
          className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer transition-colors ${
            isDragging ? "border-primary bg-primary/10" : "border-gray-300 hover:bg-gray-50"
          } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="flex flex-col items-center p-2 text-center">
              <FileSpreadsheet className="w-8 h-8 text-blue-600 mb-2" />
              <p className="font-medium text-sm truncate max-w-[200px]">{selectedFile.name}</p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-1 h-6 text-red-500"
                onClick={(e) => { e.preventDefault(); e.stopPropagation(); handleRemoveFile(); }}
              >
                <X className="w-3 h-3 mr-1" /> Ganti
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
              <p className="text-sm text-gray-500">Klik atau tarik file CSV Parameter ke sini</p>
            </div>
          )}
          <Input
            id="csvFileParameter"
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            disabled={isLoading}
          />
        </Label>

        {error && <div className="bg-red-50 text-red-600 p-3 rounded-md text-sm border border-red-200">{error}</div>}

        {!error && validPayloads.length > 0 && (
          <div className="bg-blue-50 text-blue-700 p-3 rounded-md text-sm border border-blue-200 flex items-center gap-2">
            <Check className="w-4 h-4" />
            <span>Siap update <b>{validPayloads.length}</b> data parameter.</span>
          </div>
        )}

        {isLoading && (
          <div className="space-y-2">
            <Progress value={100} className="h-2 animate-pulse" />
            <p className="text-xs text-center text-muted-foreground">{progress}</p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>Batal</Button>
        {validPayloads.length > 0 ? (
          <Button onClick={handleFinalImport} disabled={isLoading} className="bg-blue-600 hover:bg-blue-700">
            {isLoading ? "Memproses..." : "Update Sekarang"}
          </Button>
        ) : (
          <Button onClick={handleAnalyze} disabled={!selectedFile || isLoading}>Analisis File</Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}