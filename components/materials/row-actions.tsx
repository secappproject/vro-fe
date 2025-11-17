"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { MoreHorizontal, History } from "lucide-react"; 
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Dialog } from "@/components/ui/dialog";
import { AlertDialog } from "@/components/ui/alert-dialog";
import { Material, useAuthStore } from "@/lib/types";
import { DeleteMaterialAlert } from "../materials/delete-material-alert";
import { EditMaterialModal } from "../materials/edit-material-modal";

interface DataTableRowActionsProps {
  material: Material;
  onMaterialUpdated: (updatedMaterial: Material) => void;
  onMaterialDeleted: (materialId: number) => void;
}

export function MaterialDataTableRowActions({
  material,
  onMaterialUpdated,
  onMaterialDeleted,
}: DataTableRowActionsProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);
  const authRole = useAuthStore((state) => state.role);
  const router = useRouter(); 

  if (authRole === "Viewer") {
    return null;
  }

  const isSuperuser = authRole === "Superuser";

  const handleViewHistory = () => {
    router.push(`/materials/${material.id}`);
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">Buka menu</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>Aksi</DropdownMenuLabel>
          <DropdownMenuSeparator />

          <DropdownMenuItem onSelect={handleViewHistory}>
            <History className="mr-2 h-4 w-4" />
            Lihat Histori Stok
          </DropdownMenuItem>

          <DropdownMenuItem onSelect={() => setIsEditModalOpen(true)}>
            Edit Material
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onSelect={() => setIsDeleteAlertOpen(true)}
            disabled={!isSuperuser}
          >
            Hapus Material
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <EditMaterialModal
          material={material}
          setIsOpen={setIsEditModalOpen}
          onMaterialUpdated={onMaterialUpdated}
        />
      </Dialog>
      <AlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
      >
        <DeleteMaterialAlert
          material={material}
          setIsOpen={setIsDeleteAlertOpen}
          onMaterialDeleted={onMaterialDeleted}
        />
      </AlertDialog>
    </>
  );
}