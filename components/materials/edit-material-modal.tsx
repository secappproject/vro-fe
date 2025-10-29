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

interface EditMaterialModalProps {
  material: Material;
  setIsOpen: (open: boolean) => void;
  onMaterialUpdated: (updatedMaterial: Material) => void;
}

const HARDCODED_VENDORS = [
  "ABACUS",
  "UMEDA",
  "GAA",
  "Triakarya",
  "Globalindo",
  "Presisi",
];

export function EditMaterialModal({
  material,
  setIsOpen,
  onMaterialUpdated,
}: EditMaterialModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const authRole = useAuthStore((state) => state.role);
  const authUsername = useAuthStore((state) => state.username);

  const [materialCode, setMaterialCode] = useState(material.material);
  const [materialDescription, setMaterialDescription] = useState(
    material.materialDescription
  );
  const [location, setLocation] = useState(material.lokasi);
  const [vendorCode, setVendorCode] = useState(material.vendorCode);

  const [currentQuantity, setCurrentQuantity] = useState(
    String(material.currentQuantity)
  );
  const [packQuantity, setPackQuantity] = useState(
    String(material.packQuantity)
  );
  const initialTotalBins =
    material.packQuantity > 0
      ? String(material.maxBinQty / material.packQuantity)
      : "0";
  const [totalBins, setTotalBins] = useState(initialTotalBins);
  const [minBinQty, setMinBinQty] = useState(String(material.minBinQty));
  
  const [pic, setPic] = useState(authUsername || "");

  const originalQuantity = useMemo(
    () => String(material.currentQuantity),
    [material.currentQuantity]
  );
  const stockHasChanged = currentQuantity !== originalQuantity;

  const { nPackQty, nTotalBins, nMinBinQty, nMaxBinQty, nCurrentQuantity } =
    useMemo(() => {
      const nPackQty = parseInt(packQuantity, 10) || 0;
      const nTotalBins = parseInt(totalBins, 10) || 0;
      const nMinBinQty = parseInt(minBinQty, 10) || 0;
      const nMaxBinQty = nPackQty * nTotalBins;
      const nCurrentQuantity = parseInt(currentQuantity, 10) || 0;
      return { nPackQty, nTotalBins, nMinBinQty, nMaxBinQty, nCurrentQuantity };
    }, [packQuantity, totalBins, minBinQty, currentQuantity]);

  const handleSubmit = async () => {
    if (stockHasChanged && !pic) {
      alert("PIC (Nama Anda) wajib diisi karena Anda mengubah Current Stock.");
      return;
    }

    if (
      !materialCode ||
      nPackQty <= 0 ||
      nTotalBins <= 0 ||
      nMinBinQty < 0 ||
      nCurrentQuantity < 0
    ) {
      alert(
        "Semua field (kecuali deskripsi & lokasi) harus diisi dengan valid (>= 0)."
      );
      return;
    }

    if (nMaxBinQty < nMinBinQty) {
      alert(
        "Max Bin Qty (Total Bins * Pack Qty) tidak boleh lebih kecil dari Min Bin Qty."
      );
      return;
    }

    if (nCurrentQuantity > nMaxBinQty) {
      alert(
        `Current Stock (${nCurrentQuantity}) tidak boleh melebihi Max Bin Qty (${nMaxBinQty}).`
      );
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
        currentQuantity: nCurrentQuantity,
        pic: pic, // Kirim PIC ke backend
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/materials/${material.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": authRole || "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal mengupdate material.");
      }

      const updatedMaterial: Material = {
        ...material,
        ...payload,
      };

      onMaterialUpdated(updatedMaterial);
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating material:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Edit Material: {material.material}</DialogTitle>
        <DialogDescription>
          Ubah detail material, kuantitas, dan vendor di bawah ini.
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
        <div className="grid grid-cols-4 items-center gap-4 mb-4">
          <Label htmlFor="currentStock" className="text-left">
            Current Stock
          </Label>
          <Input
            id="currentStock"
            type="number"
            value={currentQuantity}
            onChange={(e) => setCurrentQuantity(e.target.value)}
            className={`col-span-3 ${
              stockHasChanged
                ? "border-destructive focus-visible:ring-destructive"
                : ""
            }`}
          />
        </div>
        
        <div className="grid grid-cols-4 items-center gap-4 mb-4">
          <Label htmlFor="pic" className="text-left">
            PIC
          </Label>
          <Input
            id="pic"
            value={pic}
            onChange={(e) => setPic(e.target.value)}
            className={`col-span-3 ${
              stockHasChanged && !pic ? "border-destructive" : ""
            }`}
            placeholder="Nama Anda (Wajib jika stok berubah)"
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
          <Label className="text-xs text-muted-foreground">
            Preview Konfigurasi Bin
          </Label>
          <p className="text-xs text-muted-foreground mb-3">
            Max Qty: <span className="font-bold text-primary">{nMaxBinQty}</span>{" "}
            (Otomatis dari {nTotalBins} bin x {nPackQty} pcs)
          </p>
          <BinPreview
            packQuantity={nPackQty}
            maxBinQty={nMaxBinQty}
            minBinQty={nMinBinQty}
            currentQuantity={nCurrentQuantity}
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
          {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}