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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useAuthStore, MaterialBin } from "@/lib/types"; 
import Papa from "papaparse";
import { FileSpreadsheet, UploadCloud, X, Download, AlertCircle } from "lucide-react";

interface ImportMaterialModalProps {
  setIsOpen: (open: boolean) => void;
  onImportSuccess: () => void;
}

interface MaterialPayload {
  material: string;
  materialDescription: string;
  lokasi: string;
  packQuantity: number;
  maxBinQty: number;
  minBinQty: number;
  vendorCode: string;
  productType: "kanban" | "consumable" | "option";
  bins?: Partial<MaterialBin>[];
}

interface ValidationRow {
  rowNum: number;
  materialCode: string;
  
  col1: number; 
  
  col2: number; 
  message: string;
  originalRow: Record<string, string>;
}

const formatFileSize = (bytes: number) => {
  if (bytes === 0) return "0 Bytes";
  const k = 1024;
  const sizes = ["Bytes", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
};

const roundUpToPack = (value: number, packQty: number) => {
  if (packQty <= 0) return value;
  return Math.ceil(value / packQty) * packQty;
};

export function ImportMaterialModal({
  setIsOpen,
  onImportSuccess,
}: ImportMaterialModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  
  
  const [activeTab, setActiveTab] = useState<"kanban" | "consumable" | "option">("kanban");

  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  const [validationRows, setValidationRows] = useState<ValidationRow[]>([]);
  const [validPayloads, setValidPayloads] = useState<MaterialPayload[]>([]);
  
  const authRole = useAuthStore((state) => state.role);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const resetState = () => {
    setSelectedFile(null);
    setValidationRows([]);
    setValidPayloads([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  }

  const handleTabChange = (value: string) => {
    setActiveTab(value as "kanban" | "consumable" | "option");
    resetState();
  };

  const handleFileSelect = (file: File | undefined) => {
    setError(null);
    setValidationRows([]);
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

  
  const handleDownloadTemplate = () => {
    let headers = ["Kode Material", "Deskripsi", "Lokasi", "Vendor"];

    if (activeTab === "kanban") {
      
      headers.push("Pack Qty", "Max Qty");
    } else if (activeTab === "consumable") {
      headers.push("Pack Qty", "Total Bins", "Qty Per Bin");
    } else if (activeTab === "option") {
      headers.push("Total Bins", "Qty Per Bin");
    }

    const csvContent = headers.join(",");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `template-import-${activeTab}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  
  const handleAnalyze = async () => {
    if (!selectedFile) {
      setError("Silakan pilih file CSV untuk diimpor.");
      return;
    }

    setIsLoading(true);
    setProgress("Menganalisis file...");
    setError(null);
    setValidationRows([]);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as Record<string, string>[];
        const fields = (results.meta.fields || []).map((f) => f.trim());
        
        const baseHeaders = ["Kode Material", "Vendor"];
        let typeHeaders: string[] = [];

        if (activeTab === "kanban") {
          
          typeHeaders = ["Pack Qty", "Max Qty"];
        } else if (activeTab === "consumable") {
          typeHeaders = ["Pack Qty", "Total Bins", "Qty Per Bin"];
        } else if (activeTab === "option") {
          typeHeaders = ["Total Bins", "Qty Per Bin"];
        }

        const requiredHeaders = [...baseHeaders, ...typeHeaders];
        const missingHeaders = requiredHeaders.filter(h => !fields.includes(h));

        if (missingHeaders.length > 0) {
          setError(`Header CSV salah untuk tipe ${activeTab.toUpperCase()}. Header wajib ada: ${missingHeaders.join(", ")}`);
          setIsLoading(false);
          return;
        }

        const valErrs: ValidationRow[] = [];
        const valPayloads: MaterialPayload[] = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNum = i + 2;
          const trimmed: Record<string, string> = {};
          for (const key in row) trimmed[key.trim()] = row[key] ? row[key].trim() : "";

          const code = trimmed["Kode Material"];
          if (!code) continue; 

          const pInt = (key: string) => parseInt(trimmed[key]?.replace(/[,.]/g, "") || "0", 10);

          if (activeTab === "kanban") {
            
            const packQty = pInt("Pack Qty");
            const rawMax = pInt("Max Qty");
            
            
            const roundedMax = roundUpToPack(rawMax, packQty);
            const minQty = packQty; 

            if (packQty <= 0) {
              valErrs.push({ rowNum, materialCode: code, col1: rawMax, col2: packQty, message: "Pack Qty harus > 0", originalRow: trimmed });
            } else if (roundedMax < minQty) {
              valErrs.push({ rowNum, materialCode: code, col1: roundedMax, col2: packQty, message: `Max (${roundedMax}) < Pack/Min (${packQty})`, originalRow: trimmed });
            } else {
              valPayloads.push({
                material: code,
                materialDescription: trimmed["Deskripsi"] || "",
                lokasi: trimmed["Lokasi"] || "",
                packQuantity: packQty,
                maxBinQty: roundedMax,
                minBinQty: minQty, 
                vendorCode: trimmed["Vendor"],
                productType: "kanban",
                bins: [] 
              });
            }

          } else {
            
            const totalBins = pInt("Total Bins");
            const qtyPerBin = pInt("Qty Per Bin");
            
            let packQty = 1; 
            if (activeTab === "consumable") {
              packQty = pInt("Pack Qty");
            }

            if (totalBins <= 0 || qtyPerBin <= 0) {
              valErrs.push({ rowNum, materialCode: code, col1: totalBins, col2: qtyPerBin, message: "Total Bins & Qty Per Bin harus > 0", originalRow: trimmed });
            } else if (activeTab === "consumable" && packQty <= 0) {
               valErrs.push({ rowNum, materialCode: code, col1: totalBins, col2: qtyPerBin, message: "Pack Qty harus > 0", originalRow: trimmed });
            } else if (qtyPerBin < packQty) {
              valErrs.push({ rowNum, materialCode: code, col1: totalBins, col2: qtyPerBin, message: `Qty Per Bin (${qtyPerBin}) < Pack Qty (${packQty})`, originalRow: trimmed });
            } else {
              
              const generatedBins = Array.from({ length: totalBins }, (_, idx) => ({
                binSequenceId: idx + 1,
                maxBinStock: qtyPerBin,
                currentBinStock: 0
              }));

              valPayloads.push({
                material: code,
                materialDescription: trimmed["Deskripsi"] || "",
                lokasi: trimmed["Lokasi"] || "",
                packQuantity: packQty,
                maxBinQty: totalBins * qtyPerBin,
                minBinQty: packQty, 
                vendorCode: trimmed["Vendor"],
                productType: activeTab,
                bins: generatedBins
              });
            }
          }
        }

        setValidationRows(valErrs);
        setValidPayloads(valPayloads);
        setIsLoading(false);
        setProgress("");
      },
      error: (error) => {
        setError(`Gagal mem-parsing file CSV: ${error.message}`);
        setIsLoading(false);
      },
    });
  };

  
  const handleEditField = (index: number, field: "col1" | "col2", value: string) => {
    const updated = [...validationRows];
    updated[index][field] = parseInt(value, 10) || 0;
    updated[index].message = "Klik Simpan untuk validasi ulang"; 
    setValidationRows(updated);
  };

  const handleRevalidateRow = (index: number) => {
    const updated = [...validationRows];
    const row = updated[index];
    const trimmed = row.originalRow;

    if (activeTab === "kanban") {
       
       const packQty = row.col2;
       const newMax = roundUpToPack(row.col1, packQty);
       const minQty = packQty; 

       if (packQty > 0 && newMax >= minQty) {
          setValidPayloads(prev => [...prev, {
            material: row.materialCode,
            materialDescription: trimmed["Deskripsi"] || "",
            lokasi: trimmed["Lokasi"] || "",
            packQuantity: packQty,
            maxBinQty: newMax,
            minBinQty: minQty,
            vendorCode: trimmed["Vendor"],
            productType: "kanban",
            bins: []
          }]);
          updated.splice(index, 1);
       } else {
         row.col1 = newMax;
         
         row.message = `Gagal: Max (${newMax}) < Pack (${packQty}) atau Pack Qty <= 0`;
       }
    } else {
       
       const totalBins = row.col1;
       const qtyPerBin = row.col2;
       
       let packQty = 1;
       if (activeTab === "consumable") packQty = parseInt(trimmed["Pack Qty"], 10) || 0;

       if (totalBins > 0 && qtyPerBin > 0 && packQty > 0 && qtyPerBin >= packQty) {
          const generatedBins = Array.from({ length: totalBins }, (_, idx) => ({
            binSequenceId: idx + 1,
            maxBinStock: qtyPerBin,
            currentBinStock: 0
          }));
          setValidPayloads(prev => [...prev, {
            material: row.materialCode,
            materialDescription: trimmed["Deskripsi"] || "",
            lokasi: trimmed["Lokasi"] || "",
            packQuantity: packQty,
            maxBinQty: totalBins * qtyPerBin,
            minBinQty: packQty,
            vendorCode: trimmed["Vendor"],
            productType: activeTab,
            bins: generatedBins
          }]);
          updated.splice(index, 1);
       } else {
          row.message = `Gagal: Total Bins > 0, Qty/Bin >= Pack Qty (${packQty})`;
       }
    }
    setValidationRows(updated);
  };

  const handleFinalImport = async () => {
    if (validPayloads.length === 0) return;

    setIsLoading(true);
    setProgress("Mengimpor data...");
    let successCount = 0;
    const apiErrors: string[] = [];

    for (let i = 0; i < validPayloads.length; i++) {
      const payload = validPayloads[i];
      const percent = Math.round(((i + 1) / validPayloads.length) * 100);
      setUploadPercent(percent);
      setProgress(`Mengimpor ${i + 1}/${validPayloads.length}: ${payload.material}`);

      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/materials/`, {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-Role": authRole || "",
            },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) {
           const json = await res.json();
           throw new Error(json.error || `HTTP ${res.status}`);
        }
        successCount++;
      } catch (err) {
        apiErrors.push(`Gagal ${payload.material}: ${String(err)}`);
      }
    }

    setIsLoading(false);
    setProgress("");
    setUploadPercent(0);
    alert(`Impor selesai.\nBerhasil: ${successCount}\nGagal: ${apiErrors.length}`);
    if (apiErrors.length > 0) console.error(apiErrors);
    
    onImportSuccess();
    setIsOpen(false);
  };

  
  const UploadArea = () => (
    <Label
      htmlFor={`csvFile-${activeTab}`}
      className={`flex flex-col items-center justify-center w-full h-32 border-2 border-dashed rounded-lg cursor-pointer ${
        isDragging
          ? "border-primary bg-primary/10"
          : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
      } ${isLoading ? "cursor-not-allowed opacity-50" : ""}`}
      onDragEnter={handleDragEnter}
      onDragLeave={handleDragLeave}
      onDragOver={(e) => e.preventDefault()}
      onDrop={handleDrop}
    >
      {selectedFile ? (
        <div className="flex flex-col items-center p-2 text-center">
          <FileSpreadsheet className="w-8 h-8 text-green-500 mb-2" />
          <p className="font-medium text-sm">{selectedFile.name}</p>
          <p className="text-xs text-muted-foreground">{formatFileSize(selectedFile.size)}</p>
          <Button
            type="button"
            variant="ghost"
            size="sm"
            className="mt-1 h-6 text-red-500 hover:text-red-700"
            onClick={(e) => { e.preventDefault(); resetState(); }}
          >
            <X className="w-3 h-3 mr-1" /> Ganti
          </Button>
        </div>
      ) : (
        <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
          <UploadCloud className="w-8 h-8 mb-2 text-gray-400" />
          <p className="text-sm text-gray-500">Klik atau tarik file CSV di sini</p>
        </div>
      )}
      <Input
        id={`csvFile-${activeTab}`}
        type="file"
        accept=".csv"
        className="hidden"
        ref={fileInputRef}
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
        disabled={isLoading}
      />
    </Label>
  );

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Impor Massal Material</DialogTitle>
        <DialogDescription>
          Pilih tipe produk (Kanban / Consumable / Option), download template yang sesuai, lalu upload.
        </DialogDescription>
      </DialogHeader>

      <div className="py-2">
        <Tabs value={activeTab} onValueChange={handleTabChange} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="kanban">Kanban</TabsTrigger>
            <TabsTrigger value="consumable">Consumable</TabsTrigger>
            <TabsTrigger value="option">Option</TabsTrigger>
          </TabsList>

          <div className="mt-4 space-y-4">
            {}
            <div className="flex items-center justify-between">
               <div className="text-sm text-muted-foreground">
                  {activeTab === 'kanban' && "Input: Pack Qty, Max Qty. (Min Qty = Pack Qty)"}
                  {activeTab === 'consumable' && "Input: Pack Qty, Total Bins, Qty Per Bin."}
                  {activeTab === 'option' && "Input: Total Bins, Qty Per Bin (Pack Qty = 1)."}
               </div>
               <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="flex items-center gap-2 border-dashed"
                  onClick={handleDownloadTemplate}
                >
                  <Download className="w-4 h-4" /> Template {activeTab.charAt(0).toUpperCase() + activeTab.slice(1)}
               </Button>
            </div>

            {}
            <TabsContent value="kanban" className="mt-0"><UploadArea /></TabsContent>
            <TabsContent value="consumable" className="mt-0"><UploadArea /></TabsContent>
            <TabsContent value="option" className="mt-0"><UploadArea /></TabsContent>

            {}
            {error && (
              <div className="p-3 bg-red-50 text-red-600 text-sm rounded-md flex items-center gap-2 border border-red-200">
                <AlertCircle className="w-4 h-4 flex-shrink-0"/>
                <span>{error}</span>
              </div>
            )}

            {}
            {validationRows.length > 0 && (
              <div className="bg-red-50 border border-red-300 text-red-800 text-sm rounded-md p-3 max-h-60 overflow-y-auto">
                <p className="font-semibold mb-2 text-xs">Perbaiki {validationRows.length} baris error:</p>
                <table className="w-full text-xs border-collapse">
                  <thead>
                    <tr className="bg-red-100 text-left">
                      <th className="p-1">Kode</th>
                      <th className="p-1">
                        {activeTab === "kanban" ? "Max Qty" : "Total Bins"}
                      </th>
                      <th className="p-1">
                        {activeTab === "kanban" ? "Pack Qty" : "Qty/Bin"}
                      </th>
                      <th className="p-1">Pesan</th>
                      <th className="p-1 text-center">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {validationRows.map((row, i) => (
                      <tr key={i} className="border-t border-red-200">
                        <td className="p-1 font-mono">{row.materialCode}</td>
                        <td className="p-1">
                          <input
                            type="number"
                            className="w-16 border border-red-300 rounded p-0.5 bg-white"
                            value={row.col1}
                            onChange={(e) => handleEditField(i, "col1", e.target.value)}
                          />
                        </td>
                        <td className="p-1">
                          <input
                            type="number"
                            className="w-16 border border-red-300 rounded p-0.5 bg-white"
                            value={row.col2}
                            onChange={(e) => handleEditField(i, "col2", e.target.value)}
                          />
                        </td>
                        <td className="p-1 text-red-700">{row.message}</td>
                        <td className="p-1 text-center">
                          <Button variant="outline" size="sm" className="h-6 text-[10px] px-2" onClick={() => handleRevalidateRow(i)}>
                            Simpan
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {}
            {isLoading && (
              <div className="space-y-1">
                <Progress value={uploadPercent} className="w-full h-2" />
                <p className="text-xs text-center text-muted-foreground">{progress}</p>
              </div>
            )}
          </div>
        </Tabs>
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setIsOpen(false)}
          disabled={isLoading}
        >
          Batal
        </Button>
        {validationRows.length > 0 ? (
          <Button disabled className="opacity-70 cursor-not-allowed">
            Perbaiki Error Dulu
          </Button>
        ) : (
          <Button
            onClick={validPayloads.length ? handleFinalImport : handleAnalyze}
            disabled={isLoading || !selectedFile}
          >
            {isLoading
              ? "Memproses..."
              : validPayloads.length
              ? `Impor ${validPayloads.length} Data`
              : "Analisis & Validasi"}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}