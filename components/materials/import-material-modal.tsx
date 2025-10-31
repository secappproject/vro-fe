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
import { FileChartLine, UploadCloud, X } from "lucide-react";

interface ImportMaterialModalProps {
  setIsOpen: (open: boolean) => void;
  onImportSuccess: () => void;
}

interface ValidationRow {
  rowNum: number;
  materialCode: string;
  maxQty: number;
  minQty: number;
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

export function ImportMaterialModal({
  setIsOpen,
  onImportSuccess,
}: ImportMaterialModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const [progress, setProgress] = useState("");
  const [uploadPercent, setUploadPercent] = useState(0);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [validationRows, setValidationRows] = useState<ValidationRow[]>([]);
  const [validPayloads, setValidPayloads] = useState<any[]>([]);
  const authRole = useAuthStore((state) => state.role);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // --- File Handling ---
  const handleFileSelect = (file: File | undefined) => {
    setError(null);
    setValidationRows([]);
    setValidPayloads([]);
    if (!file) {
      setSelectedFile(null);
      return;
    }
    if (file.type !== "text/csv") {
      setError("File harus berekstensi .csv");
      setSelectedFile(null);
      return;
    }
    setSelectedFile(file);
  };

  const handleDragEnter = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(true);
  };
  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
  };
  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setValidationRows([]);
    setValidPayloads([]);
    setError(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleDownloadTemplate = () => {
    const headers = [
      "Kode Material",
      "Deskripsi",
      "Lokasi",
      "Pack Qty",
      "Max Qty",
      "Min Qty",
      "Vendor",
    ];
    const csvContent = headers.join(",");
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = "template-import-material.csv";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Upload & Validation ---
  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Silakan pilih file CSV untuk diimpor.");
      return;
    }

    setIsLoading(true);
    setProgress("Membaca file...");
    setUploadPercent(0);
    setError(null);
    setValidationRows([]);

    Papa.parse(selectedFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const data = results.data as Record<string, string>[];
        const fields = (results.meta.fields || []).map((f) => f.trim());
        const requiredHeaders = [
          "Kode Material",
          "Pack Qty",
          "Max Qty",
          "Min Qty",
          "Vendor",
        ];
        const missingHeaders = requiredHeaders.filter(
          (h) => !fields.includes(h)
        );

        if (missingHeaders.length > 0) {
          setError(
            `Header CSV tidak valid. Header yang hilang: ${missingHeaders.join(", ")}`
          );
          setIsLoading(false);
          return;
        }

        const valErrs: ValidationRow[] = [];
        const valPayloads: any[] = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNum = i + 2;
          const trimmed: Record<string, string> = {};
          for (const key in row)
            trimmed[key.trim()] = row[key] ? row[key].trim() : "";

          const nPackQty = parseInt(trimmed["Pack Qty"], 10) || 0;
          const nMax = parseInt(trimmed["Max Qty"], 10) || 0;
          const nMin = parseInt(trimmed["Min Qty"], 10) || 0;
          const code = trimmed["Kode Material"];

          if (!code) continue;

          if (nMax < nMin) {
            valErrs.push({
              rowNum,
              materialCode: code,
              maxQty: nMax,
              minQty: nMin,
              message: `Max Qty (${nMax}) < Min Qty (${nMin})`,
              originalRow: trimmed,
            });
          } else {
            valPayloads.push({
              material: code,
              materialDescription: trimmed["Deskripsi"] || "",
              lokasi: trimmed["Lokasi"] || "",
              packQuantity: nPackQty,
              maxBinQty: nMax,
              minBinQty: nMin,
              vendorCode: trimmed["Vendor"],
            });
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

  // --- Edit in Modal ---
  const handleEditField = (
    index: number,
    field: "maxQty" | "minQty",
    value: string
  ) => {
    const updated = [...validationRows];
    updated[index][field] = parseInt(value, 10);
    updated[index].message =
      updated[index].maxQty < updated[index].minQty
        ? `Max Qty (${updated[index].maxQty}) < Min Qty (${updated[index].minQty})`
        : "";
    setValidationRows(updated);
  };

  const handleRevalidateRow = (index: number) => {
    const updated = [...validationRows];
    const row = updated[index];

    if (row.maxQty >= row.minQty) {
      // pindahkan ke payload valid
      const newPayload = {
        material: row.materialCode,
        materialDescription: row.originalRow["Deskripsi"] || "",
        lokasi: row.originalRow["Lokasi"] || "",
        packQuantity: parseInt(row.originalRow["Pack Qty"], 10) || 0,
        maxBinQty: row.maxQty,
        minBinQty: row.minQty,
        vendorCode: row.originalRow["Vendor"],
      };
      setValidPayloads((prev) => [...prev, newPayload]);

      updated.splice(index, 1);
      setValidationRows(updated);
    } else {
      alert("Masih ada error pada nilai yang dimasukkan!");
    }
  };

  // --- Final Import ---
  const handleFinalImport = async () => {
    if (validPayloads.length === 0) {
      alert("Tidak ada data valid untuk diimpor.");
      return;
    }

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
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/materials/`,
          {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              "X-User-Role": authRole || "",
            },
            body: JSON.stringify(payload),
          }
        );
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        successCount++;
      } catch (err) {
        apiErrors.push(`Gagal ${payload.material}: ${String(err)}`);
      }
    }

    setIsLoading(false);
    setProgress("");
    setUploadPercent(0);
    alert(
      `Impor selesai. Berhasil: ${successCount}, Gagal: ${apiErrors.length}.`
    );
    onImportSuccess();
    setIsOpen(false);
  };

  return (
    <DialogContent className="sm:max-w-2xl">
      <DialogHeader>
        <DialogTitle>Impor Massal Material</DialogTitle>
        <DialogDescription>
          Upload file CSV dengan data material baru. Header yang perlu diisi:
          Kode Material, Pack Qty, Max Qty, Min Qty.
        </DialogDescription>
      </DialogHeader>

      <div className="gap-4 py-4">
        <Button
          type="button"
          variant="link"
          className="text-sm text-blue-600 hover:underline p-0 h-auto mb-3"
          onClick={handleDownloadTemplate}
        >
          Download Template CSV
        </Button>

        <Label
          htmlFor="csvFile"
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          } ${isLoading ? "cursor-not-allowed" : ""}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={(e) => e.preventDefault()}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="flex flex-col items-center p-4 text-center">
              <FileChartLine className="w-12 h-12 text-green-500" />
              <p className="font-medium text-sm mt-2">{selectedFile.name}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 text-red-500 hover:text-red-700"
                onClick={handleRemoveFile}
              >
                <X className="w-4 h-4 mr-1" /> Hapus File
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500">
                <span className="font-semibold">Klik untuk memilih</span> atau
                tarik file ke sini
              </p>
              <p className="text-xs text-gray-500">Hanya file .CSV yang didukung</p>
            </div>
          )}
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
          />
        </Label>

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        {/* === Editable Error Table === */}
        {validationRows.length > 0 && (
          <div className="bg-red-50 border border-red-300 text-red-800 text-sm rounded-md p-3 mt-4 max-h-72 overflow-y-auto">
            <p className="font-semibold mb-2">
              Ditemukan {validationRows.length} baris error:
            </p>
            <table className="w-full text-xs border-collapse">
              <thead>
                <tr className="bg-red-100 text-left">
                  <th className="p-1">Baris</th>
                  <th className="p-1">Kode</th>
                  <th className="p-1">Max Qty</th>
                  <th className="p-1">Min Qty</th>
                  <th className="p-1">Pesan</th>
                  <th className="p-1 text-center">Aksi</th>
                </tr>
              </thead>
              <tbody>
                {validationRows.map((row, i) => (
                  <tr key={i} className="border-t">
                    <td className="p-1">{row.rowNum}</td>
                    <td className="p-1">{row.materialCode}</td>
                    <td className="p-1">
                      <input
                        type="number"
                        className="w-20 border rounded p-0.5"
                        value={row.maxQty}
                        onChange={(e) =>
                          handleEditField(i, "maxQty", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-1">
                      <input
                        type="number"
                        className="w-20 border rounded p-0.5"
                        value={row.minQty}
                        onChange={(e) =>
                          handleEditField(i, "minQty", e.target.value)
                        }
                      />
                    </td>
                    <td className="p-1 text-xs text-red-700">{row.message}</td>
                    <td className="p-1 text-center">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleRevalidateRow(i)}
                      >
                       Simpan
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {isLoading && (
          <div className="mt-4">
            <Progress value={uploadPercent} className="w-full" />
            <p className="text-sm text-center mt-2 animate-pulse">
              {progress || "Memproses..."}
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)} disabled={isLoading}>
          Batal
        </Button>
        {validationRows.length > 0 ? (
          <Button disabled className="cursor-not-allowed opacity-60">
            Perbaiki semua error dulu
          </Button>
        ) : (
          <Button
            onClick={validPayloads.length ? handleFinalImport : handleUpload}
            disabled={isLoading || !selectedFile}
          >
            {isLoading ? "Memproses..." : validPayloads.length ? "Impor Data" : "Validasi CSV"}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}
