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
  const authRole = useAuthStore((state) => state.role);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileSelect = (file: File | undefined) => {
    setError(null);
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
    e.stopPropagation();
    setIsDragging(true);
  };

  const handleDragLeave = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
  };

  const handleDragOver = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
  };

  const handleDrop = (e: DragEvent<HTMLLabelElement>) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragging(false);
    handleFileSelect(e.dataTransfer.files[0]);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    setError(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
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
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", "template-import-material.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      alert("Silakan pilih file CSV untuk diimpor.");
      return;
    }

    setIsLoading(true);
    setProgress("Membaca file...");
    setUploadPercent(0);
    setError(null);

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
          alert(
            `Header CSV tidak valid. Header yang hilang: ${missingHeaders.join(
              ", "
            )}`
          );
          setIsLoading(false);
          setProgress("");
          return;
        }

        const payloads = [];
        const validationErrors = [];

        for (let i = 0; i < data.length; i++) {
          const row = data[i];
          const rowNum = i + 2;

          const trimmedRow: Record<string, string> = {};
          for (const key in row) {
            trimmedRow[key.trim()] = row[key] ? row[key].trim() : "";
          }

          const nPackQty = parseInt(trimmedRow["Pack Qty"], 10) || 0;
          const nMaxBinQty = parseInt(trimmedRow["Max Qty"], 10) || 0;
          const nMinBinQty = parseInt(trimmedRow["Min Qty"], 10) || 0;
          const materialCode = trimmedRow["Kode Material"];
          const vendorCode = trimmedRow["Vendor"];

          if (!materialCode) {
            validationErrors.push(
              `Baris ${rowNum}: Kode Material wajib diisi.`
            );
            continue;
          }
          if (nPackQty <= 0) {
            validationErrors.push(
              `Baris ${rowNum}: Pack Qty (${nPackQty}) harus lebih besar dari 0.`
            );
            continue;
          }
          if (nMaxBinQty < nMinBinQty) {
            validationErrors.push(
              `Baris ${rowNum}: Max Qty (${nMaxBinQty}) tidak boleh lebih kecil dari Min Qty (${nMinBinQty}).`
            );
            continue;
          }
          if (nMaxBinQty % nPackQty !== 0) {
            validationErrors.push(
              `Baris ${rowNum}: Max Qty (${nMaxBinQty}) harus kelipatan dari Pack Qty (${nPackQty}).`
            );
            continue;
          }

          payloads.push({
            material: materialCode,
            materialDescription: trimmedRow["Deskripsi"] || "",
            lokasi: trimmedRow["Lokasi"] || "",
            packQuantity: nPackQty,
            maxBinQty: nMaxBinQty,
            minBinQty: nMinBinQty,
            vendorCode: vendorCode,
          });
        }

        if (validationErrors.length > 0) {
          alert(
            `Ditemukan ${
              validationErrors.length
            } error validasi:\n\n${validationErrors
              .slice(0, 10)
              .join("\n")}\n${
              validationErrors.length > 10 ? "...dan lainnya" : ""
            }`
          );
          setIsLoading(false);
          setProgress("");
          return;
        }

        if (payloads.length === 0) {
          alert("Tidak ada data valid untuk diimpor.");
          setIsLoading(false);
          setProgress("");
          return;
        }

        let successCount = 0;
        const apiErrors = [];

        for (let i = 0; i < payloads.length; i++) {
          const payload = payloads[i];
          const percent = Math.round(((i + 1) / payloads.length) * 100);
          setUploadPercent(percent);
          setProgress(
            `Mengimpor ${i + 1} / ${payloads.length}: ${payload.material}`
          );

          try {
            const response = await fetch(
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

            if (!response.ok) {
              const errorData = await response.json();
              throw new Error(errorData.error || `HTTP error ${response.status}`);
            }
            successCount++;
          } catch (error) {
            const errMsg =
              error instanceof Error ? error.message : "Error tidak diketahui";
            apiErrors.push(`Gagal mengimpor ${payload.material}: ${errMsg}`);
          }
        }

        setIsLoading(false);
        setProgress("");
        setUploadPercent(0);

        let summaryMessage = `Impor selesai. Berhasil: ${successCount}. Gagal: ${apiErrors.length}.`;
        if (apiErrors.length > 0) {
          summaryMessage += `\n\nError:\n${apiErrors.slice(0, 5).join("\n")}${
            apiErrors.length > 5 ? "\n...dan lainnya" : ""
          }`;
        }

        alert(summaryMessage);
        onImportSuccess();
        setIsOpen(false);
      },
      error: (error) => {
        alert(`Gagal mem-parsing file CSV: ${error.message}`);
        setIsLoading(false);
        setProgress("");
      },
    });
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Impor Massal Material</DialogTitle>
        <DialogDescription>
          Upload file CSV dengan data material baru. Header wajib: "Kode
          Material", "Pack Qty", "Max Qty", "Min Qty", "Vendor".
        </DialogDescription>
      </DialogHeader>

      <div className="gap-4 py-4">
        <div className="mb-4">
          <Button
            type="button"
            variant="link"
            className="text-sm text-blue-600 hover:underline p-0 h-auto"
            onClick={handleDownloadTemplate}
          >
            Download Template CSV
          </Button>
        </div>

        <Label
          htmlFor="csvFile"
          className={`flex flex-col items-center justify-center w-full h-48 border-2 border-dashed rounded-lg cursor-pointer ${
            isDragging
              ? "border-primary bg-primary/10"
              : "border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-800"
          } ${isLoading ? "cursor-not-allowed" : ""}`}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          onDragOver={handleDragOver}
          onDrop={handleDrop}
        >
          {selectedFile ? (
            <div className="flex flex-col items-center p-4 text-center">
              <FileChartLine className="w-12 h-12 text-green-500" />
              <p className="font-medium text-sm mt-2">
                {selectedFile.name}
              </p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(selectedFile.size)}
              </p>
              <Button
                type="button"
                variant="ghost"
                size="sm"
                className="mt-2 text-red-500 hover:text-red-700"
                onClick={handleRemoveFile}
                disabled={isLoading}
              >
                <X className="w-4 h-4 mr-1" />
                Hapus File
              </Button>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center pt-5 pb-6 text-center">
              <UploadCloud className="w-10 h-10 mb-3 text-gray-400" />
              <p className="mb-2 text-sm text-gray-500 dark:text-gray-400">
                <span className="font-semibold">Klik untuk memilih</span> atau
                tarik file ke sini
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Hanya file .CSV yang didukung
              </p>
            </div>
          )}
          <Input
            id="csvFile"
            type="file"
            accept=".csv"
            className="hidden"
            ref={fileInputRef}
            onChange={(e) => handleFileSelect(e.target.files?.[0])}
            disabled={isLoading}
          />
        </Label>

        {error && <p className="text-sm text-red-600 mt-2">{error}</p>}

        {isLoading && (
          <div className="mt-4">
            <Progress value={uploadPercent} className="w-full" />
            <p className="text-sm text-muted-foreground text-center mt-2 animate-pulse">
              {progress || "Memproses..."}
            </p>
          </div>
        )}
      </div>

      <DialogFooter>
        <Button
          variant="outline"
          onClick={() => setIsOpen(false)}
          disabled={isLoading}
        >
          Batal
        </Button>
        <Button
          onClick={handleUpload}
          disabled={isLoading || !selectedFile}
        >
          {isLoading ? "Mengunggah..." : "Upload dan Proses"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}