"use client";

import { useState, useMemo, useEffect } from "react";
import { useAuthStore, Material, MaterialBin } from "@/lib/types";
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
import { Wand2 } from "lucide-react";

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

const roundUpToPack = (value: number, packQty: number) => {
  if (packQty <= 0) return value;
  return Math.ceil(value / packQty) * packQty;
};

interface FormErrors {
  materialCode?: string;
  vendorCode?: string;
  packQuantity?: string;
  quantityPerBin?: string;
  maxBinQty?: string;
  totalBins?: string;
  minBinQty?: string;
  currentQuantity?: string;
  pic?: string;
  general?: string;
  vendorStock?: string;
  [key: string]: string | undefined;
}

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
  const [productType, setProductType] = useState<
    "kanban" | "consumable" | "option"
  >(material.productType || "kanban");

  const [kanbanCurrentQuantity, setKanbanCurrentQuantity] = useState(
    String(material.currentQuantity)
  );
  const [vendorStock, setVendorStock] = useState(
    String(material.vendorStock ?? 0)
  );

  const [packQuantity, setPackQuantity] = useState(
    String(material.packQuantity)
  );
  const [maxBinQty, setMaxBinQty] = useState(String(material.maxBinQty));

  const [quantityPerBin, setQuantityPerBin] = useState(
    String(material.bins?.[0]?.maxBinStock || material.packQuantity)
  );

  const [totalBins, setTotalBins] = useState(() => {
    const qtyPerBin = material.bins?.[0]?.maxBinStock || material.packQuantity;
    if (qtyPerBin > 0 && material.productType !== "kanban") {
      return String(material.maxBinQty / qtyPerBin);
    }
    return String(
      material.bins?.length ||
        (material.packQuantity > 0
          ? material.maxBinQty / material.packQuantity
          : 0)
    );
  });

  const [pic, setPic] = useState(authUsername || "");
  const [errors, setErrors] = useState<FormErrors>({});
  const [showKelipatanError, setShowKelipatanError] = useState(false);

  const [bins, setBins] = useState<MaterialBin[]>(
    material.bins ? JSON.parse(JSON.stringify(material.bins)) : []
  );

  // MODIFIED: isReadOnly is strictly for Viewer. 
  // Admin and Vendor can edit, but have restrictions on General Info.
  const isViewer = authRole === "Viewer";
  
  // MODIFIED: Admin and Vendor cannot edit general info (Code, Desc, Location)
  const isGeneralInfoRestricted = authRole === "Admin" || authRole === "Vendor";

  const {
    nPackQty,
    nMinBinQty,
    nMaxBinQty,
    nTotalBinsMemo,
    nQuantityPerBinMemo,
  } = useMemo(() => {
    const nPackQty = parseInt(packQuantity, 10) || 0;
    let nQuantityPerBinMemo = parseInt(quantityPerBin, 10) || 0;

    let nMaxBinQty = 0;
    let nMinBinQty = 0;
    let nTotalBinsMemo = 0;

    if (productType === "kanban") {
      const initialMaxBinQty = parseInt(maxBinQty, 10) || 0;
      nMaxBinQty = roundUpToPack(initialMaxBinQty, nPackQty);
      nMinBinQty = nPackQty;
      nQuantityPerBinMemo = nPackQty;
      nTotalBinsMemo = nPackQty > 0 ? Math.ceil(nMaxBinQty / nPackQty) : 0;
    } else if (productType === "consumable") {
      nTotalBinsMemo = parseInt(totalBins, 10) || 0;
      nMaxBinQty = nTotalBinsMemo * nQuantityPerBinMemo;
      nMinBinQty = nPackQty;
    } else {
      nTotalBinsMemo = parseInt(totalBins, 10) || 0;
      nMaxBinQty = nTotalBinsMemo * nQuantityPerBinMemo;
      nMinBinQty = nPackQty;
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
    totalBins,
    productType,
  ]);

  const nVendorStock = useMemo(() => parseInt(vendorStock, 10) || 0, [
    vendorStock,
  ]);

  useEffect(() => {
    if (productType === "kanban") {
      setBins([]);
      return;
    }
    setBins((currentBins) => {
      const newBins: MaterialBin[] = [];
      for (let i = 1; i <= nTotalBinsMemo; i++) {
        const existingBin = currentBins.find((b) => b.binSequenceId === i);
        if (existingBin) {
          newBins.push({
            ...existingBin,
            maxBinStock: nQuantityPerBinMemo,
          });
        } else {
          newBins.push({
            id: -i,
            materialId: material.id,
            binSequenceId: i,
            maxBinStock: nQuantityPerBinMemo,
            currentBinStock: 0,
          });
        }
      }
      return newBins.slice(0, nTotalBinsMemo);
    });
  }, [nTotalBinsMemo, nQuantityPerBinMemo, productType, material.id]);

  const nCurrentQuantity = useMemo(() => {
    if (productType === "kanban") {
      return parseInt(kanbanCurrentQuantity, 10) || 0;
    }
    return bins.reduce((acc, bin) => acc + bin.currentBinStock, 0);
  }, [bins, productType, kanbanCurrentQuantity]);

  const stockHasChanged = useMemo(() => {
    return (
      nCurrentQuantity !== material.currentQuantity ||
      nVendorStock !== (material.vendorStock ?? 0)
    );
  }, [
    nCurrentQuantity,
    material.currentQuantity,
    nVendorStock,
    material.vendorStock,
  ]);

  const handleBinStockChange = (index: number, value: string) => {
    const stock = parseInt(value, 10);
    const newBins = [...bins];
    const bin = newBins[index];

    if (isNaN(stock)) {
      bin.currentBinStock = 0;
    } else if (stock < 0) {
      bin.currentBinStock = 0;
    } else {
      bin.currentBinStock = stock;
    }

    setBins(newBins);
    clearError(`bin_${index}`);
  };

  const clearError = (field: keyof FormErrors) => {
    if (errors[field]) {
      setErrors((prev) => ({ ...prev, [field]: undefined }));
    }
  };

  const handleSetAllBins = (stockValue: number) => {
    if (nQuantityPerBinMemo <= 0 && stockValue > 0) return;
    const newStock = Math.min(nQuantityPerBinMemo, Math.max(0, stockValue));
    const newBins = bins.map((bin) => ({
      ...bin,
      currentBinStock: newStock,
    }));
    setBins(newBins);
    const newErrors = { ...errors };
    bins.forEach((_, index) => {
      delete newErrors[`bin_${index}`];
    });
    setErrors(newErrors);
  };

  const replenishment = useMemo(() => {
    const soh = nCurrentQuantity;
    const totalBins = nTotalBinsMemo;
    const qtyPerBin = nQuantityPerBinMemo;

    if (qtyPerBin <= 0) return 0;

    const calc = Math.floor(totalBins - soh / qtyPerBin);
    return calc < 0 ? 0 : calc;
  }, [nCurrentQuantity, nTotalBinsMemo, nQuantityPerBinMemo]);

  const previewMaterial = useMemo((): Material => {
    return {
      ...material,
      material: materialCode,
      materialDescription,
      lokasi: location,
      vendorCode,
      productType: productType as Material["productType"],
      packQuantity: nPackQty,
      maxBinQty: nMaxBinQty,
      minBinQty: nMinBinQty,
      currentQuantity: nCurrentQuantity,
      vendorStock: nVendorStock,
      bins: productType === "kanban" ? undefined : bins,
    };
  }, [
    material,
    materialCode,
    materialDescription,
    location,
    vendorCode,
    productType,
    nPackQty,
    nMaxBinQty,
    nMinBinQty,
    nCurrentQuantity,
    bins,
    nVendorStock,
  ]);

  const autoFixKelipatan = () => {
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
    setShowKelipatanError(false);
    const newErrors: FormErrors = {};

    if (stockHasChanged && !pic.trim()) {
      newErrors.pic = "PIC wajib diisi karena stok berubah.";
    }
    // Validation still runs, but fields might be disabled.
    // Backend will ensure consistency if disabled fields are tampered with.
    if (!materialCode.trim()) {
      newErrors.materialCode = "Kode Material wajib diisi.";
    }
    if (!vendorCode) {
      newErrors.vendorCode = "Vendor wajib dipilih.";
    }
    if (nPackQty <= 0) {
      newErrors.packQuantity = "Pack Qty harus > 0.";
    }

    if (nVendorStock < 0) {
      newErrors.vendorStock = "Vendor Stock tidak boleh negatif.";
    }

    if (productType === "kanban") {
      if (parseInt(maxBinQty, 10) <= 0) {
        newErrors.maxBinQty = "Max Qty harus > 0.";
      }
      if (nCurrentQuantity < 0) {
        newErrors.currentQuantity = "Current Stock tidak boleh negatif.";
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
    }

    let generalError = "";

    if (productType === "kanban") {
      if (nCurrentQuantity > nMaxBinQty) {
        newErrors.currentQuantity = `Stok (${nCurrentQuantity}) melebihi Max Qty (Final: ${nMaxBinQty}).`;
      }
    } else {
      if (
        nQuantityPerBinMemo > 0 &&
        nPackQty > 0 &&
        nQuantityPerBinMemo < nPackQty
      ) {
        newErrors.quantityPerBin = `Qty per Bin (${nQuantityPerBinMemo}) tidak boleh lebih kecil dari Pack Qty (${nPackQty}).`;
      }

      bins.forEach((bin, index) => {
        if (bin.currentBinStock < 0) {
          newErrors[`bin_${index}`] = "Tidak boleh negatif.";
        }
        if (bin.currentBinStock > nQuantityPerBinMemo) {
          newErrors[
            `bin_${index}`
          ] = `Stok bin (${bin.currentBinStock}) melebihi Qty/Bin (${nQuantityPerBinMemo}).`;
        }
      });
      if (nCurrentQuantity > nMaxBinQty) {
        generalError += `Total stok bin (${nCurrentQuantity}) melebihi Max Qty (Final: ${nMaxBinQty}). `;
      }
    }

    if (nMaxBinQty > 0 && nPackQty > 0 && nMaxBinQty % nPackQty !== 0) {
      generalError += `Max Qty (Final: ${nMaxBinQty}) harus merupakan kelipatan dari Pack Qty (${nPackQty}). `;
      setShowKelipatanError(true);
    }

    if (nMaxBinQty > 0 && nMaxBinQty < nMinBinQty) {
      generalError += `Max Qty (Final: ${nMaxBinQty}) tidak boleh lebih kecil dari Min Qty (Final: ${nMinBinQty}). `;
    }

    if (generalError) {
      newErrors.general = generalError.trim();
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async () => {
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
        vendorStock: nVendorStock,
        currentQuantity: nCurrentQuantity,
        pic: pic,
        productType: productType,
        bins: productType === "kanban" ? null : bins,
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

      // If restricted, we trust backend to keep original general info
      // But for frontend optimisitc update, we keep what was in state
      // (which matches original if disabled)
      const updatedMaterial: Material = {
        ...material,
        ...payload,
        id: material.id,
        bins: previewMaterial.bins,
      };

      onMaterialUpdated(updatedMaterial);
      setIsOpen(false);
    } catch (error) {
      console.error("Error updating material:", error);
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
        <DialogTitle>
          {isViewer ? "Lihat Material" : "Edit Material"}: {material.material}
        </DialogTitle>
        <DialogDescription>
          {isViewer
            ? "Lihat detail material, kuantitas, dan vendor di bawah ini."
            : "Ubah detail material, kuantitas, dan vendor di bawah ini."}
        </DialogDescription>
      </DialogHeader>

      <div className="gap-4 py-4 max-h-[70vh] overflow-y-auto pr-4">
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
              disabled={isViewer || isGeneralInfoRestricted}
            />
            {errors.materialCode && (
              <p className="text-xs text-destructive mt-1">
                {errors.materialCode}
              </p>
            )}
            {isGeneralInfoRestricted && (
                <p className="text-[10px] text-muted-foreground mt-1">
                    Hanya Superuser yang dapat mengubah Kode Material.
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
            disabled={isViewer || isGeneralInfoRestricted}
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
            disabled={isViewer || isGeneralInfoRestricted}
          />
        </div>
        <div className="grid grid-cols-4 items-center gap-4 mb-4">
          <Label htmlFor="productType" className="text-left">
            Tipe Produk
          </Label>
          <Select
            value={productType}
            onValueChange={(value: string) => {
              const newType = value as "kanban" | "consumable" | "option";
              setProductType(newType);
              if (newType === "option") {
                setQuantityPerBin("1");
              }
            }}
            disabled={isViewer}
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
        {productType === "kanban" && (
          <div className="grid grid-cols-4 items-start gap-4 mb-4">
            <Label htmlFor="currentStock" className="text-left pt-2">
              Current Stock (SOH)
            </Label>
            <div className="col-span-3">
              <Input
                id="currentStock"
                type="number"
                value={kanbanCurrentQuantity}
                onChange={(e) => {
                  setKanbanCurrentQuantity(e.target.value);
                  clearError("currentQuantity");
                }}
                className={
                  errors.currentQuantity
                    ? "border-destructive"
                    : stockHasChanged &&
                      nCurrentQuantity !== material.currentQuantity
                    ? "border-destructive focus-visible:ring-destructive"
                    : ""
                }
                disabled={isViewer}
              />
              {errors.currentQuantity && (
                <p className="text-xs text-destructive mt-1">
                  {errors.currentQuantity}
                </p>
              )}
            </div>
          </div>
        )}

        <div className="grid grid-cols-4 items-start gap-4 mb-4">
          <Label htmlFor="pic" className="text-left pt-2">
            PIC
          </Label>
          <div className="col-span-3">
            <Input
              id="pic"
              value={pic}
              onChange={(e) => {
                setPic(e.target.value);
                clearError("pic");
              }}
              className={
                errors.pic
                  ? "border-destructive"
                  : stockHasChanged && !pic
                  ? "border-destructive"
                  : ""
              }
              placeholder="Nama Anda (Wajib jika stok berubah)"
              disabled={isViewer}
            />
            {errors.pic && (
              <p className="text-xs text-destructive mt-1">{errors.pic}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-4 items-start gap-4 mb-4">
          <Label htmlFor="vendorStock" className="text-left pt-2">
            Vendor Stock
          </Label>
          <div className="col-span-3">
            <Input
              id="vendorStock"
              type="number"
              value={vendorStock}
              onChange={(e) => {
                setVendorStock(e.target.value);
                clearError("vendorStock");
              }}
              placeholder="Stok vendor"
              className={
                errors.vendorStock
                  ? "border-destructive"
                  : stockHasChanged &&
                    nVendorStock !== (material.vendorStock ?? 0)
                  ? "border-destructive focus-visible:ring-destructive"
                  : ""
              }
              disabled={isViewer}
            />
            {errors.vendorStock && (
              <p className="text-xs text-destructive mt-1">
                {errors.vendorStock}
              </p>
            )}
            {stockHasChanged &&
              nVendorStock !== (material.vendorStock ?? 0) && (
                <p className="text-xs text-destructive mt-1">
                  Vendor Stock berubah. PIC wajib diisi.
                </p>
              )}
          </div>
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
              disabled={isViewer}
            />
            {errors.packQuantity && (
              <p className="text-xs text-destructive mt-1">
                {errors.packQuantity}
              </p>
            )}
          </div>
          {productType === "kanban" && (
            <div className="space-y-2">
              <Label htmlFor="maxBinQty">Max Qty (Total)</Label>
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
                disabled={isViewer}
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
                disabled={isViewer}
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
                disabled={isViewer}
              />
              {errors.quantityPerBin && (
                <p className="text-xs text-destructive mt-1">
                  {errors.quantityPerBin}
                </p>
              )}
            </div>
          )}
        </div>

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
                disabled={isViewer}
              >
                <Wand2 className="mr-2 h-4 w-4" />
                Otomatis Bulatkan Qty per Bin
              </Button>
            )}
          </div>
        )}

        {productType !== "kanban" && bins.length > 0 && (
          <div className="col-span-4 border-t pt-4 mt-4">
            <Label className="text-base font-medium">Stok per Bin (SOH)</Label>
            <p className="text-sm text-muted-foreground mb-4">
              Atur stok untuk tiap bin individual. Total stok akan dihitung
              otomatis.
            </p>

            <div className="flex items-center gap-2 mb-4">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSetAllBins(0)}
                disabled={
                  (nQuantityPerBinMemo <= 0 && bins.length > 0) || isViewer
                }
              >
                Empty All Bins (Set to 0)
              </Button>
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => handleSetAllBins(nQuantityPerBinMemo)}
                disabled={nQuantityPerBinMemo <= 0 || isViewer}
              >
                Fill All Bins (Set to {nQuantityPerBinMemo || 0})
              </Button>
            </div>

            <div className="grid grid-cols-3 gap-x-4 gap-y-5">
              {bins.map((bin, index) => (
                <div key={bin.binSequenceId} className="space-y-1">
                  <Label htmlFor={`bin-${bin.binSequenceId}`}>
                    Bin {bin.binSequenceId} (Max: {nQuantityPerBinMemo})
                  </Label>
                  <Input
                    id={`bin-${bin.binSequenceId}`}
                    type="number"
                    value={bin.currentBinStock}
                    onChange={(e) =>
                      handleBinStockChange(index, e.target.value)
                    }
                    className={
                      errors[`bin_${index}`] ? "border-destructive" : ""
                    }
                    disabled={isViewer}
                  />
                  {errors[`bin_${index}`] && (
                    <p className="text-xs text-destructive">
                      {errors[`bin_${index}`]}
                    </p>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="col-span-4 rounded-md border p-4 my-4">
          <Label className="text-xs text-muted-foreground">
            Preview Konfigurasi Bin
          </Label>
          <p className="text-xs text-muted-foreground mb-3">
            Total Stok (SOH):{" "}
            <span
              className={`font-bold ${
                stockHasChanged &&
                nCurrentQuantity !== material.currentQuantity
                  ? "text-destructive"
                  : "text-primary"
              }`}
            >
              {nCurrentQuantity}
            </span>{" "}
            | Vendor Stock:{" "}
            <span
              className={`font-bold ${
                stockHasChanged &&
                nVendorStock !== (material.vendorStock ?? 0)
                  ? "text-destructive"
                  : "text-primary"
              }`}
            >
              {nVendorStock}
            </span>
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Max Qty (Final):{" "}
            <span className="font-bold text-primary">{nMaxBinQty}</span> | Min
            Qty (Final):{" "}
            <span className="font-bold text-primary">{nMinBinQty}</span>
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            Replenishment:{" "}
            <span className="font-bold text-primary">{replenishment}</span> bin
            (SOH: {nCurrentQuantity})
          </p>
          <p className="text-xs text-muted-foreground mb-3">
            {productType === "kanban" ? "Setara" : "Total"}{" "}
            <span className="font-bold text-primary">{nTotalBinsMemo}</span> bin
            , masing-masing{" "}
            <span className="font-bold text-primary">
              {nQuantityPerBinMemo}
            </span>{" "}
            pcs
          </p>
          <BinPreview material={previewMaterial} />
        </div>

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
              disabled={isViewer}
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
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          {isViewer ? "Tutup" : "Batal"}
        </Button>
        {!isViewer && (
          <Button onClick={handleSubmit} disabled={isLoading || isViewer}>
            {isLoading ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        )}
      </DialogFooter>
    </DialogContent>
  );
}