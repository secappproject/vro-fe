"use client";

import { useState, useMemo } from "react";
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
import { Material, useAuthStore } from "@/lib/types";
import { BinPreview } from "./bin-preview";
import { Wand2 } from "lucide-react";

// ... (Interface, consts, roundUpToPack, FormErrors... tidak berubah) ...
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

const roundUpToPack = (value: number, packQty: number) => {
  if (packQty <= 0) return value;
  return Math.ceil(value / packQty) * packQty;
};

interface FormErrors {
  materialCode?: string;
  vendorCode?: string;
  packQuantity?: string;
  quantityPerBin?: string; // Input error for Consumable/Option
  maxBinQty?: string; // Input error for Kanban
  totalBins?: string; // Input error for Consumable/Option
  minBinQty?: string; // Input error for Option
  general?: string;
}

export function AddMaterialModal({
  setIsOpen,
  onMaterialAdded,
}: AddMaterialModalProps) {
  // ... (State, useMemo... tidak berubah) ...
  const [isLoading, setIsLoading] = useState(false);
  const authRole = useAuthStore((state) => state.role);

  const [materialCode, setMaterialCode] = useState("");
  const [materialDescription, setMaterialDescription] = useState("");
  const [location, setLocation] = useState("");
  const [vendorCode, setVendorCode] = useState("");
  const [productType, setProductType] = useState<
    "kanban" | "consumable" | "option"
  >("kanban");

  const [packQuantity, setPackQuantity] = useState(""); // Input Pack (All)
  const [quantityPerBin, setQuantityPerBin] = useState(""); // Input Qty per Bin (Consumable/Option)
  const [maxBinQty, setMaxBinQty] = useState(""); // Input Max (Kanban)
  const [minBinQty, setMinBinQty] = useState(""); // Input Min (Option)
  const [totalBins, setTotalBins] = useState(""); // Input Bins (Consumable/Option)

  const [errors, setErrors] = useState<FormErrors>({});
  const [showKelipatanError, setShowKelipatanError] = useState(false);

  const {
    nPackQty,
    nMinBinQty,
    nMaxBinQty,
    nTotalBinsMemo,
    nQuantityPerBinMemo,
  } = useMemo(() => {
    const nPackQty = parseInt(packQuantity, 10) || 0;

    let nMaxBinQty = 0;
    let nMinBinQty = 0;
    let nTotalBinsMemo = 0;
    let nQuantityPerBinMemo = 0;

    if (productType === "kanban") {
      // Input: max, pack.
      const initialMaxBinQty = parseInt(maxBinQty, 10) || 0;
      nMaxBinQty = roundUpToPack(initialMaxBinQty, nPackQty);
      nMinBinQty = nPackQty; // Rule 1: min == pack
      nQuantityPerBinMemo = nPackQty; // Rule 1: quantity perbin == pack
      nTotalBinsMemo =
        nQuantityPerBinMemo > 0
          ? Math.ceil(nMaxBinQty / nQuantityPerBinMemo)
          : 0; // Rule 1: bin = max/min (max/pack)
    } else if (productType === "consumable") {
      // Input: bin, pack, quantity perbin
      nTotalBinsMemo = parseInt(totalBins, 10) || 0;
      nQuantityPerBinMemo = parseInt(quantityPerBin, 10) || 0;
      nMaxBinQty = nTotalBinsMemo * nQuantityPerBinMemo; // Rule 2: max = bin * qty_per_bin
      nMinBinQty = nPackQty; // Rule 2: min == pack
    } else {
      // "option"
      // Input: min, bin, pack, quantity perbin
      const initialMinBinQty = parseInt(minBinQty, 10) || 0;
      nTotalBinsMemo = parseInt(totalBins, 10) || 0;
      nQuantityPerBinMemo = parseInt(quantityPerBin, 10) || 0;
      nMaxBinQty = nTotalBinsMemo * nQuantityPerBinMemo; // Rule 3: max = bin * qty_per_bin
      nMinBinQty = roundUpToPack(initialMinBinQty, nPackQty); // Rule 3: Input min (rounded to pack)
    }

    return {
      nPackQty,
      nMinBinQty,
      nMaxBinQty,
      nTotalBinsMemo,
      nQuantityPerBinMemo,
    };
  }, [
    packQuantity,
    quantityPerBin,
    maxBinQty,
    minBinQty,
    totalBins,
    productType,
  ]);
  
  // --- TAMBAHAN: useMemo untuk Replenishment ---
  const replenishment = useMemo(() => {
    const soh = 0; // Stok selalu 0 saat add
    const totalBins = nTotalBinsMemo;
    const qtyPerBin = nQuantityPerBinMemo;

    if (qtyPerBin <= 0) return 0;
    
    // Rumus: ROUNDDOWN(bin - (soh / qty perbin), 0)
    const calc = Math.floor(totalBins - (soh / qtyPerBin));
    return calc < 0 ? 0 : calc;
  }, [nTotalBinsMemo, nQuantityPerBinMemo]);
  // ------------------------------------------

  const previewMaterial = useMemo((): Material => {
    // ... (logika previewMaterial tidak berubah) ...
    return {
      id: 0,
      material: materialCode,
      materialDescription,
      lokasi: location,
      vendorCode,
      productType: productType as Material["productType"],
      packQuantity: nPackQty,
      maxBinQty: nMaxBinQty,
      minBinQty: nMinBinQty,
      currentQuantity: 0,
      bins:
        productType !== "kanban"
          ? Array.from({ length: nTotalBinsMemo }, (_, i) => ({
              id: i,
              materialId: 0,
              binSequenceId: i + 1,
              maxBinStock: nQuantityPerBinMemo,
              currentBinStock: 0,
            }))
          : undefined,
    };
  }, [
    materialCode,
    materialDescription,
    location,
    vendorCode,
    productType,
    nPackQty,
    nMaxBinQty,
    nMinBinQty,
    nTotalBinsMemo,
    nQuantityPerBinMemo,
  ]);

  const clearError = (field: keyof FormErrors) => {
    // ... (logika clearError tidak berubah) ...
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const autoFixKelipatan = () => {
    // ... (logika autoFixKelipatan tidak berubah) ...
    if (
      productType === "kanban" ||
      nTotalBinsMemo <= 0 ||
      nPackQty <= 0
    )
      return;
    const targetMax = roundUpToPack(nMaxBinQty, nPackQty); 

    const newQtyPerBin = Math.ceil(targetMax / nTotalBinsMemo);

    const newMax = nTotalBinsMemo * newQtyPerBin;

    const finalTargetMax = roundUpToPack(newMax, nPackQty);

    const finalNewQtyPerBin = Math.ceil(finalTargetMax / nTotalBinsMemo);

    setQuantityPerBin(String(finalNewQtyPerBin));

    clearError("general");
    setShowKelipatanError(false);
  };
  
  const validate = (): boolean => {
    // ... (logika validate tidak berubah, sudah ada validasi Qty/Bin >= PackQty) ...
    setShowKelipatanError(false); 
    const newErrors: FormErrors = {};

    if (!materialCode.trim()) {
      newErrors.materialCode = "Kode Material wajib diisi.";
    }
    if (!vendorCode) {
      newErrors.vendorCode = "Vendor wajib dipilih.";
    }
    if (nPackQty <= 0) {
      newErrors.packQuantity = "Pack Qty harus > 0.";
    }

    if (productType === "kanban") {
      if (parseInt(maxBinQty, 10) <= 0) {
        newErrors.maxBinQty = "Max Bin Qty harus > 0.";
      }
    } else if (productType === "consumable") {
      if (nTotalBinsMemo <= 0) {
        newErrors.totalBins = "Total Bins harus > 0.";
      }
      if (nQuantityPerBinMemo <= 0) {
        newErrors.quantityPerBin = "Qty per Bin harus > 0.";
      }
    } else {
      if (nTotalBinsMemo <= 0) {
        newErrors.totalBins = "Total Bins harus > 0.";
      }
      if (nQuantityPerBinMemo <= 0) {
        newErrors.quantityPerBin = "Qty per Bin harus > 0.";
      }
      if (parseInt(minBinQty, 10) < 0) {
        newErrors.minBinQty = "Min Qty tidak boleh negatif.";
      }
    }

    let generalError = ""; 

    if (productType !== "kanban") {
      if (nQuantityPerBinMemo > 0 && nPackQty > 0 && nQuantityPerBinMemo < nPackQty) {
        newErrors.quantityPerBin = `Qty per Bin (${nQuantityPerBinMemo}) tidak boleh lebih kecil dari Pack Qty (${nPackQty}).`;
      }
    }

    if (nMaxBinQty > 0 && nPackQty > 0 && nMaxBinQty % nPackQty !== 0) {
      generalError += `Max Qty (Final: ${nMaxBinQty}) harus merupakan kelipatan dari Pack Qty (${nPackQty}). `;
      setShowKelipatanError(true); 
    }

    if (nMaxBinQty > 0 && nMaxBinQty < nMinBinQty) {
      generalError += `Max Qty (${nMaxBinQty}) tidak boleh lebih kecil dari Min Qty (${nMinBinQty}).`;
    }

    if (generalError) {
      newErrors.general = generalError.trim();
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
    // ... (logika handleSubmit tidak berubah) ...
    setErrors({});
    if (!validate()) {
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
        productType: productType,
        bins: previewMaterial.bins,
      };

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
        throw new Error(errorData.error || "Gagal menambah material.");
      }

      const newMaterial = await response.json();
      onMaterialAdded(newMaterial);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding material:", error);
      const errorMsg =
        error instanceof Error ? error.message : "Terjadi kesalahan.";
      if (errorMsg.includes("duplicate key")) {
        setErrors({ materialCode: "Kode Material ini sudah ada." });
      } else {
        setErrors({ general: errorMsg });
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        {/* ... (Header tidak berubah) ... */}
        <DialogTitle>Tambah Material Baru</DialogTitle>
        <DialogDescription>
          Isi detail material, konfigurasi bin, dan vendor di bawah ini.
        </DialogDescription>
      </DialogHeader>

      <div className="gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
        {/* ... (Semua input form tidak berubah) ... */}
        {/* (Saya singkat) */}
        <div className="grid grid-cols-4 items-start gap-4 mb-4">
          <Label htmlFor="materialCode" className="text-left pt-2">
            Kode Material
          </Label>
          <div className="col-span-3">
            <Input
              id="materialCode"
              value={materialCode}
              onChange={(e) => {
                setMaterialCode(e.target.value);
                clearError("materialCode");
              }}
              className={errors.materialCode ? "border-destructive" : ""}
            />
            {errors.materialCode && (
              <p className="text-xs text-destructive mt-1">
                {errors.materialCode}
              </p>
            )}
          </div>
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
          <Label htmlFor="productType" className="text-left">
            Tipe Produk
          </Label>
          <Select
            value={productType}
            onValueChange={(value: string) =>
              setProductType(value as "kanban" | "consumable" | "option")
            }
          >
            <SelectTrigger className="col-span-3">
              <SelectValue placeholder="Pilih Tipe" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="kanban">Kanban (Agregat)</SelectItem>
              <SelectItem value="consumable">Consumable (Per Bin)</SelectItem>
              <SelectItem value="option">Option (Per Bin)</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="col-span-4 border-t pt-4 mt-2 grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="packQty">Pack Quantity</Label>
            <Input
              id="packQty"
              type="number"
              value={packQuantity}
              onChange={(e) => {
                setPackQuantity(e.target.value);
                clearError("packQuantity");
              }}
              placeholder="Qty per scan"
              className={errors.packQuantity ? "border-destructive" : ""}
            />
            {errors.packQuantity && (
              <p className="text-xs text-destructive mt-1">
                {errors.packQuantity}
              </p>
            )}
          </div>
          {productType === "kanban" && (
            <div className="space-y-2">
              <Label htmlFor="maxBinQty">Max Bin Qty (Total)</Label>
              <Input
                id="maxBinQty"
                type="number"
                value={maxBinQty}
                onChange={(e) => {
                  setMaxBinQty(e.target.value);
                  clearError("maxBinQty");
                }}
                placeholder="Kapasitas total"
                className={errors.maxBinQty ? "border-destructive" : ""}
              />
              {errors.maxBinQty && (
                <p className="text-xs text-destructive mt-1">
                  {errors.maxBinQty}
                </p>
              )}
            </div>
          )}
          {(productType === "consumable" || productType === "option") && (
            <div className="space-y-2">
              <Label htmlFor="totalBins">Total Bins</Label>
              <Input
                id="totalBins"
                type="number"
                value={totalBins}
                onChange={(e) => {
                  setTotalBins(e.target.value);
                  clearError("totalBins");
                }}
                placeholder="Jumlah bin"
                className={errors.totalBins ? "border-destructive" : ""}
              />
              {errors.totalBins && (
                <p className="text-xs text-destructive mt-1">
                  {errors.totalBins}
                </p>
              )}
            </div>
          )}
          {(productType === "consumable" || productType === "option") && (
            <div className="space-y-2">
              <Label htmlFor="quantityPerBin">Quantity per Bin</Label>
              <Input
                id="quantityPerBin"
                type="number"
                value={quantityPerBin}
                onChange={(e) => {
                  setQuantityPerBin(e.target.value);
                  clearError("quantityPerBin");
                }}
                placeholder="Kapasitas per bin"
                className={errors.quantityPerBin ? "border-destructive" : ""}
              />
              {errors.quantityPerBin && (
                <p className="text-xs text-destructive mt-1">
                  {errors.quantityPerBin}
                </p>
              )}
            </div>
          )}
          {productType === "option" && (
            <div className="space-y-2 col-span-2">
              <Label htmlFor="minQty">Min Bin Qty (Trigger)</Label>
              <Input
                id="minQty"
                type="number"
                value={minBinQty}
                onChange={(e) => {
                  setMinBinQty(e.target.value);
                  clearError("minBinQty");
                }}
                placeholder="Titik trigger 'merah'"
                className={errors.minBinQty ? "border-destructive" : ""}
              />
              {errors.minBinQty && (
                <p className="text-xs text-destructive mt-1">
                  {errors.minBinQty}
                </p>
              )}
            </div>
          )}
        </div>


        <div className="col-span-4 rounded-md border p-4 my-2">
          <Label className="text-xs text-muted-foreground">
            Preview Konfigurasi Bin
          </Label>
          <p className="text-xs text-muted-foreground mb-3">
            Max Qty (Final):{" "}
            <span className="font-bold text-primary">{nMaxBinQty}</span> | Min
            Qty (Final):{" "}
            <span className="font-bold text-primary">{nMinBinQty}</span>
          </p>
          {/* --- BARIS BARU DITAMBAHKAN DI SINI --- */}
          <p className="text-xs text-muted-foreground mb-3">
            Replenishment:{" "}
            <span className="font-bold text-primary">{replenishment}</span> bin
            (SOH: 0)
          </p>
          {/* ------------------------------------ */}
          <p className="text-xs text-muted-foreground mb-3">
            Total{" "}
            <span className="font-bold text-primary">{nTotalBinsMemo}</span> bin
            , masing-masing{" "}
            <span className="font-bold text-primary">
              {nQuantityPerBinMemo}
            </span>{" "}
            pcs
          </p>
          <BinPreview material={previewMaterial} />
        </div>

        {/* ... (Blok Error, Vendor... tidak berubah) ... */}
        {errors.general && (
          <div className="col-span-4 my-2 text-sm text-destructive text-center p-2 bg-destructive/10 rounded-md">
            <p>{errors.general}</p>
            {showKelipatanError && (
              <Button
                type="button"
                variant="destructive"
                size="sm"
                className="mt-2"
                onClick={autoFixKelipatan}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Otomatis Bulatkan Qty per Bin
              </Button>
            )}
          </div>
        )}
        <div className="grid grid-cols-4 items-start gap-4 border-t pt-4 mt-2">
          <Label htmlFor="vendorCode" className="text-left pt-2">
            Vendor
          </Label>
          <div className="col-span-3">
            <Select
              value={vendorCode}
              onValueChange={(value) => {
                setVendorCode(value);
                clearError("vendorCode");
              }}
            >
              <SelectTrigger
                className={errors.vendorCode ? "border-destructive" : ""}
              >
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
            {errors.vendorCode && (
              <p className="text-xs text-destructive mt-1">
                {errors.vendorCode}
              </p>
            )}
          </div>
        </div>
      </div>

      <DialogFooter>
        {/* ... (Footer tidak berubah) ... */}
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