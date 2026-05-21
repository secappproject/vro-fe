"use client";

import { useState } from "react";
import { useAuthStore, Vendor } from "@/lib/types";
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

interface AddVendorModalProps {
  setIsOpen: (open: boolean) => void;
  onVendorAdded: (newVendor: Vendor) => void;
}

const PREDEFINED_TYPES = ["Panel", "Busbar"];
const OTHER_VALUE = "Lainnya";

export function AddVendorModal({
  setIsOpen,
  onVendorAdded,
}: AddVendorModalProps) {
  const [isLoading, setIsLoading] = useState(false);
  const role = useAuthStore((state) => state.role);
  const [companyName, setCompanyName] = useState("");
  const [selectedType, setSelectedType] = useState("");
  const [customType, setCustomType] = useState("");
  const [email, setEmail] = useState("");

  const handleSubmit = async () => {
    const finalVendorType =
      selectedType === OTHER_VALUE ? customType.trim() : selectedType;

    if (!companyName || !finalVendorType) {
      alert("Nama Perusahaan dan Tipe Vendor harus diisi.");
      return;
    }
    setIsLoading(true);
    try {
      const payload = {
        companyName,
        vendorType: finalVendorType,
        email: email.trim(),
      };

      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/vendors/`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "X-User-Role": role || "",
          },
          body: JSON.stringify(payload),
        }
      );

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menambah vendor.");
      }

      const newVendor = await response.json();
      onVendorAdded(newVendor);
      setIsOpen(false);
    } catch (error) {
      console.error("Error adding vendor:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-md">
      <DialogHeader>
        <DialogTitle>Tambah Vendor Baru</DialogTitle>
        <DialogDescription>
          Isi detail perusahaan/vendor di bawah ini.
        </DialogDescription>
      </DialogHeader>

      <div className="space-y-4 py-4">
        <div className="space-y-2">
          <Label htmlFor="companyName">Nama Perusahaan</Label>
          <Input
            id="companyName"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="vendorTypeSelect">Tipe Vendor</Label>
          <Select value={selectedType} onValueChange={setSelectedType}>
            <SelectTrigger>
              <SelectValue placeholder="Pilih tipe" />
            </SelectTrigger>
            <SelectContent>
              {PREDEFINED_TYPES.map((type) => (
                <SelectItem key={type} value={type}>
                  {type}
                </SelectItem>
              ))}
              <SelectItem value={OTHER_VALUE}>Lainnya...</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {selectedType === OTHER_VALUE && (
          <div className="space-y-2">
            <Label htmlFor="customVendorType">Tipe Lainnya</Label>
            <Input
              id="customVendorType"
              value={customType}
              onChange={(e) => setCustomType(e.target.value)}
              placeholder="Masukkan tipe vendor kustom"
            />
          </div>
        )}

        <div className="space-y-2">
          <Label htmlFor="email">Email</Label>
          <Input
            id="email"
            type="text"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="vendor1@company.com; vendor2@company.com"
          />
          <p className="text-xs text-muted-foreground">
            Bisa masukkan lebih dari 1 email, pisahkan dengan titik koma (;)
          </p>
        </div>
      </div>

      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={isLoading}>
          {isLoading ? "Menyimpan..." : "Simpan Vendor"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}