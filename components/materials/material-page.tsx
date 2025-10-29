"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { Material, useAuthStore } from "@/lib/types";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { PlusCircle, QrCode, Import } from "lucide-react";

import { getMaterialColumns } from "@/components/materials/columns";
import { MaterialDataTable } from "@/components/materials/material-data-table";
import { MaterialAuthSkeleton } from "./material-skeleton";
import { AddMaterialModal } from "./add-material.modal";
import { AutoScanMaterialModal } from "./scan-material-modal";
import { ImportMaterialModal } from "./import-material-modal";

export function MaterialPage() {
  const [data, setData] = useState<Material[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isScanModalOpen, setIsScanModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const role = useAuthStore((state) => state.role);
  const [isClient, setIsClient] = useState(false);
  const router = useRouter();

  useEffect(() => {
    setIsClient(true);
    if (role && role !== "Admin") {
      router.push("/");
    }
  }, [role, router]);

  async function getMaterialData() {
    if (!role) return;
    setIsLoading(true);
    try {
      const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/materials/`;
      const res = await fetch(apiUrl, {
        headers: { "X-User-Role": role },
      });
      if (!res.ok) {
        throw new Error("Gagal mengambil data material");
      }
      const materials = await res.json();
      setData(materials || []);
    } catch (error) {
      console.error("Error fetching material data:", error);
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    if (role) {
      getMaterialData();
    }
  }, [role]);

  const handleMaterialUpdated = (updatedMaterial: Material) => {
    setData((prevData) =>
      prevData.map((material) =>
        material.id === updatedMaterial.id ? updatedMaterial : material
      )
    );
  };

  const handleMaterialDeleted = (materialId: number) => {
    setData((prevData) =>
      prevData.filter((material) => material.id !== materialId)
    );
  };

  const handleMaterialAdded = (newMaterial: Material) => {
    setData((prevData) => [newMaterial, ...prevData]);
    getMaterialData();
  };

  const handleScansSaved = () => {
    getMaterialData();
  };

  const columns = getMaterialColumns(
    handleMaterialUpdated,
    handleMaterialDeleted
  );

  if (!isClient || !role) {
    return <MaterialAuthSkeleton />;
  }
  if (isLoading) {
    return <MaterialAuthSkeleton />;
  }

  return (
    <div className="container mx-auto py-10">
      <div className="md:flex md:justify-between md:items-center mb-4">
        <div className="mb-4 md:mb-0">
          <h1 className="text-3xl">Manajemen Material</h1>
          <p className="text-muted-foreground font-light mt-1">
            Mengatur daftar master material, bin, dan kuantitas.
          </p>
        </div>

        <div className="flex flex-col md:flex-row gap-2">
          {role === "Admin" && (
            <Button
              variant="outline"
              className="flex w-full md:w-auto"
              onClick={() => setIsImportModalOpen(true)}
            >
              <Import className="mr-2 h-4 w-4" />
              Import Massal
            </Button>
          )}

          <Button
            variant="outline"
            className="flex w-full md:w-auto"
            onClick={() => setIsScanModalOpen(true)}
          >
            <QrCode className="mr-2 h-4 w-4" />
            Scan Stok (Otomatis)
          </Button>

          {role === "Admin" && (
            <Button
              className="flex w-full md:w-auto"
              onClick={() => setIsAddModalOpen(true)}
            >
              <PlusCircle className="mr-2 h-4 w-4" />
              Tambah Material
            </Button>
          )}
        </div>
      </div>

      <MaterialDataTable columns={columns} data={data} />

      <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
        <AddMaterialModal
          setIsOpen={setIsAddModalOpen}
          onMaterialAdded={handleMaterialAdded}
        />
      </Dialog>

      <Dialog open={isScanModalOpen} onOpenChange={setIsScanModalOpen}>
        <AutoScanMaterialModal
          setIsOpen={setIsScanModalOpen}
          onScansSaved={handleScansSaved}
        />
      </Dialog>

      <Dialog open={isImportModalOpen} onOpenChange={setIsImportModalOpen}>
        <ImportMaterialModal
          setIsOpen={setIsImportModalOpen}
          onImportSuccess={getMaterialData}
        />
      </Dialog>
    </div>
  );
}