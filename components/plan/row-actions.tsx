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
import { Project, useAuthStore } from "@/lib/types"; // <-- Import useAuthStore

import { StartPanelDeliveryModal } from "./start-plan-delivery-modal";
import { EditProjectModal } from "./edit-project-modal";
import { DeleteProjectAlert } from "../reusable-datatable/delete-project-alert";

interface DataTableRowActionsProps {
  project: Project;
}

export function DataTableRowActions({ project }: DataTableRowActionsProps) {
  const [isStartModalOpen, setIsStartModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false);

  const role = useAuthStore((state) => state.role);
  const isAdmin = role === "Admin" || role === "admin";

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
            Edit Proyek
          </DropdownMenuItem>

          {isAdmin && (
            <DropdownMenuItem
              className="text-red-600"
              onSelect={() => setIsDeleteAlertOpen(true)}
            >
              Hapus Proyek
            </DropdownMenuItem>
          )}
          
        </DropdownMenuContent>
      </DropdownMenu>

      <Dialog open={isStartModalOpen} onOpenChange={setIsStartModalOpen}>
        <StartPanelDeliveryModal
          project={project}
          setIsOpen={setIsStartModalOpen}
        />
      </Dialog>
      <Dialog open={isEditModalOpen} onOpenChange={setIsEditModalOpen}>
        <EditProjectModal project={project} setIsOpen={setIsEditModalOpen} />
      </Dialog>
      <AlertDialog
        open={isDeleteAlertOpen}
        onOpenChange={setIsDeleteAlertOpen}
      >
        <DeleteProjectAlert
          project={project}
          setIsOpen={setIsDeleteAlertOpen}
        />
      </AlertDialog>
    </>
  );
}