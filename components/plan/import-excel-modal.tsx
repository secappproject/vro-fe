"use client";

import { useState, useRef } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog, 
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import * as XLSX from "xlsx";
import { useAuthStore } from "@/lib/types";
import { UploadCloud } from "lucide-react"; 

interface ImportExcelModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

interface ExcelRowData {
  "Project Name": string;
  "WBS": string;
  "Category": string;
  "Plan Start": number | string | Date;
  "Qty": number;
  "Vendor Panel": string;
  "Vendor Busbar": string;
  "Progress Panel": number;
  "Status Busbar": string;
  [key: string]: unknown;
}

export function ImportExcelModal({ isOpen, onClose, onSuccess }: ImportExcelModalProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null); 
  const [isUploading, setIsUploading] = useState(false); 
  const [error, setError] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      setSelectedFile(e.target.files[0]);
      setError(null);
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      setError("Silakan pilih file Excel terlebih dahulu."); 
      return;
    }

    setIsUploading(true);
    setError(null);

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        const data = event.target?.result;
        const workbook = XLSX.read(data, { type: "binary", cellDates: true });
        const sheetName = workbook.SheetNames[0];
        const worksheet = workbook.Sheets[sheetName];
        const json = XLSX.utils.sheet_to_json<ExcelRowData>(worksheet);

        const transformedJson = json.map((row: ExcelRowData) => ({
          projectName: row["Project Name"] ?? "",
          wbs: row["WBS"] ?? "",
          category: row["Category"] ?? "PIX",
          planStart: excelDateToJSDate(row["Plan Start"]),
          quantity: row["Qty"] ?? 0,
          vendorPanel: row["Vendor Panel"] ?? "",
          vendorBusbar: row["Vendor Busbar"] ?? "",
          panelProgress: row["Progress Panel"] ?? 0,
          statusBusbar: row["Status Busbar"] ?? "Punching/Bending",
        }));

        const role = useAuthStore.getState().role;
        const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/bulk`, {
          method: "POST",
          headers: {
              "Content-Type": "application/json",
              "X-User-Role": role || '',
          },
          body: JSON.stringify(transformedJson),
        });

        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.error || "Gagal mengimpor data.");
        }

        onSuccess(); 
        onClose();
      } catch (error) {
        console.error("Error importing data:", error);
        setError(error instanceof Error ? error.message : "Terjadi kesalahan saat impor."); 
      } finally {
        setIsUploading(false);
        setSelectedFile(null);
        if(fileInputRef.current) fileInputRef.current.value = "";
      }
    };

    reader.readAsBinaryString(selectedFile);
  };

  const excelDateToJSDate = (serialOrDate: number | string | Date | undefined | null): string | null => {
    if (serialOrDate instanceof Date) {
        const date = serialOrDate;
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } else if (typeof serialOrDate === 'number') {
        const utc_days  = Math.floor(serialOrDate - 25569);
        const utc_value = utc_days * 86400;
        const date_info = new Date(utc_value * 1000);
        const fractional_day = serialOrDate - Math.floor(serialOrDate) + 0.0000001;
        let total_seconds = Math.floor(86400 * fractional_day);
        const seconds = total_seconds % 60;
        total_seconds -= seconds;
        const hours = Math.floor(total_seconds / (60 * 60));
        const minutes = Math.floor(total_seconds / 60) % 60;
        const date = new Date(date_info.getFullYear(), date_info.getMonth(), date_info.getDate(), hours, minutes, seconds);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    } else if (typeof serialOrDate === 'string') {
        try {
            const date = new Date(serialOrDate);
            if (!isNaN(date.getTime())) {
                const year = date.getFullYear();
                const month = String(date.getMonth() + 1).padStart(2, '0');
                const day = String(date.getDate()).padStart(2, '0');
                return `${year}-${month}-${day}`;
            }
        } catch {}
    }
    return null;
  }


  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-[425px]">
        <DialogHeader>
          <DialogTitle>Impor Data dari Excel</DialogTitle>
          {/* <DialogDescription className="font-light">
            Pilih file .xlsx atau .xls. Pastikan kolom sesuai dengan template:
            &quot;Project Name&quot;, &quot;WBS&quot;, &quot;Category&quot;, &quot;Plan Start&quot;, &quot;Qty&quot;, &quot;Vendor Panel&quot;, &quot;Vendor Busbar&quot;, &quot;Progress Panel&quot;, &quot;Status Busbar&quot;.
          </DialogDescription> */}
        </DialogHeader>
        
        <div className="grid gap-4 py-4">
          <div
            className="flex flex-col items-center justify-center p-8 border-2 border-dashed rounded-lg cursor-pointer hover:border-primary/60"
            onClick={() => fileInputRef.current?.click()}
          >
            <UploadCloud className="w-8 h-8 text-muted-foreground" />
            <p className="mt-2 font-medium">
              {selectedFile ? selectedFile.name : "Klik untuk memilih file"}
            </p>
            <p className="text-sm text-muted-foreground">File .xlsx atau .xls</p>
          </div>
          <Input
            id="excel-file"
            type="file"
            ref={fileInputRef}
            className="sr-only"
            onChange={handleFileChange}
            accept=".xlsx, .xls"
          />
          {error && <p className="text-sm text-destructive text-center">{error}</p>}
        </div>
        
        <DialogFooter>
          <Button variant="outline" onClick={onClose} disabled={isUploading}>
            Batal
          </Button>
          <Button onClick={handleUpload} disabled={isUploading || !selectedFile}>
            {isUploading ? "Mengimpor..." : "Impor Data"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}