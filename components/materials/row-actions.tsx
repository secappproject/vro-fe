"use client";

import { useState } from "react";
import { MoreHorizontal } from "lucide-react";
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
import { Material } from "@/lib/types"; // Diubah
import { DeleteMaterialAlert } from "./delete-material-alert";
import { EditMaterialModal } from "./edit-material-modal";

interface DataTableRowActionsProps {
  material: Material; // Diubah
  onMaterialUpdated: (updatedMaterial: Material) => void; // Diubah
  onMaterialDeleted: (materialId: number) => void; // Diubah
}

export function MaterialDataTableRowActions({ // Diubah
  material,
  onMaterialUpdated,
  onMaterialDeleted,
}: DataTableRowActionsProps) {
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

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
          <DropdownMenuItem onSelect={() => setIsEditModalOpen(true)}>
            Edit Material
          </DropdownMenuItem>
          <DropdownMenuItem
            className="text-red-600"
            onSelect={() => setIsDeleteAlertOpen(true)}
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
