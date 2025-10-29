"use client";

import { useState, useMemo } from "react";
import { useAuthStore, Material } from "@/lib/types";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { BinPreview } from "./bin-preview";

interface AddMaterialModalProps {
  setIsOpen: (open: boolean) => void;
  onMaterialAdded: (newMaterial: Material) => void;
}

const HARDCODED_VENDORS = [
  "ABACUS",
  "UMEDA",
  "GAA",
  "Triakarya",
  "Globalindo",
  "Presisi",
];

export function AddMaterialModal({
  setIsOpen,
  onMaterialAdded,
}: AddMaterialModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const authRole = useAuthStore((state) => state.role);

  const [materialCode, setMaterialCode] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [location, setLocation] = useState("");
  const [vendorCode, setVendorCode] = useState("");

  const [packQuantity, setPackQuantity] = useState("");
  const [totalBins, setTotalBins] = useState("");
  const [minBinQty, setMinBinQty] = useState("");

  const { nPackQty, nTotalBins, nMinBinQty, nMaxBinQty } = useMemo(() => {
    const nPackQty = parseInt(packQuantity, 10) || 0;
    const nTotalBins = parseInt(totalBins, 10) || 0;
    const nMinBinQty = parseInt(minBinQty, 10) || 0;
    const nMaxBinQty = nPackQty * nTotalBins;
    return { nPackQty, nTotalBins, nMinBinQty, nMaxBinQty };
  }, [packQuantity, totalBins, minBinQty]);

  const handleSubmit = async () => {
    if (
      !materialCode ||
      !vendorCode ||
      nPackQty <= 0 ||
      nTotalBins <= 0 ||
      nMinBinQty < 0
    ) {
      alert("Semua field (kecuali deskripsi & lokasi) harus diisi dengan valid.");
      return;
    }

    if (nMaxBinQty < nMinBinQty) {
      alert("Max Bin Qty (Total Bins * Pack Qty) tidak boleh lebih kecil dari Min Bin Qty.");
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        material: materialCode,
        materialDescription,
        lokasi: location,
        packQuantity: nPackQty,
        maxBinQty: nMaxBinQty,
        minBinQty: nMinBinQty,
        vendorCode,
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/materials`,
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
        throw new Error(errorData.error || "Gagal menambah material.");
      }

      const newMaterial = await response.json();
      onMaterialAdded(newMaterial);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding material:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Tambah Material Baru</DialogTitle>
        <DialogDescription>
          Isi detail material, konfigurasi bin, dan vendor di bawah ini.
        </DialogDescription>
      </DialogHeader>

      <div className="gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        <div className="grid grid-cols-4 items-center gap-4 mb-4">
          <Label htmlFor="materialCode" className="text-left">
            Kode Material
          </Label>
          <Input
            id="materialCode"
            value={materialCode}
            onChange={(e) => setMaterialCode(e.target.value)}
            className="col-span-3"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4 mb-4">
          <Label htmlFor="description" className="text-left">
            Deskripsi
          </Label>
          <Input
            id="description"
            value={materialDescription}
            onChange={(e) => setMaterialDescription(e.target.value)}
            className="col-span-3"
            placeholder="(Opsional)"
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4 mb-4">
          <Label htmlFor="location" className="text-left">
            Lokasi
          </Label>
          <Input
            id="location"
            value={location}
            onChange={(e) => setLocation(e.target.value)}
            className="col-span-3"
            placeholder="(Opsional)"
          />
        </div>

        <div className="col-span-4 border-t pt-4 mt-2 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="packQty">Pack Quantity</Label>
            <Input
              id="packQty"
              type="number"
              value={packQuantity}
              onChange={(e) => setPackQuantity(e.target.value)}
              placeholder="Qty per scan"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="totalBins">Total Bins</Label>
            <Input
              id="totalBins"
              type="number"
              value={totalBins}
              onChange={(e) => setTotalBins(e.target.value)}
              placeholder="Jumlah bin"
            />
          </div>
          <div className="space-y-2 col-span-2">
            <Label htmlFor="minQty">Min Bin Qty (Trigger Merah)</Label>
            <Input
              id="minQty"
              type="number"
              value={minBinQty}
              onChange={(e) => setMinBinQty(e.target.value)}
              placeholder="Titik trigger 'merah'"
            />
          </div>
        </div>

        <div className="col-span-4 rounded-md border p-4 my-2">
          <Label className="text-xs text-muted-foreground">Preview Konfigurasi Bin</Label>
          <p className="text-xs text-muted-foreground mb-3">
            Max Qty: <span className="font-bold text-primary">{nMaxBinQty}</span> (Otomatis dari {nTotalBins} bin x {nPackQty} pcs)
          </p>
          <BinPreview
            packQuantity={nPackQty}
            maxBinQty={nMaxBinQty}
            minBinQty={nMinBinQty}
            currentQuantity={0}
          />
        </div>

        <div className="grid grid-cols-4 items-center gap-4 border-t pt-4 mt-2">
          <Label htmlFor="vendorCode" className="text-left">
            Vendor
          </Label>
          <Select value={vendorCode} onValueChange={setVendorCode}>
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Pilih vendor" />
            </SelectTrigger>
            <SelectContent>
              {HARDCODED_VENDORS.map((code) => (
                <SelectItem key={code} value={code}>
                  {code}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan Material"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}