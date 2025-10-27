"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Project, useAuthStore } from "@/lib/types";
import {
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface DeleteProjectAlertProps {
  project: Project;
  setIsOpen: (open: boolean) => void;
}

export function DeleteProjectAlert({ project, setIsOpen }: DeleteProjectAlertProps) {
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleDelete = async () => {
    setIsLoading(true);
    try {
      const role = useAuthStore.getState().role;
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}`, {
        method: "DELETE",
        headers: {
            "X-User-Role": role || '',
        },
      });
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal menghapus proyek.");
      }
      setIsOpen(false);
      router.refresh();
    } catch (error) {
      console.error("Error deleting project:", error);
      alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <AlertDialogContent>
      <AlertDialogHeader>
        <AlertDialogTitle>Apakah Anda benar-benar yakin?</AlertDialogTitle>
        <AlertDialogDescription>
          Tindakan ini tidak dapat dibatalkan. Ini akan menghapus proyek secara permanen{' '}
          <strong className="font-medium text-foreground">{project.projectName}</strong> dari server.
        </AlertDialogDescription>
      </AlertDialogHeader>
      <AlertDialogFooter>
        <AlertDialogCancel onClick={() => setIsOpen(false)} disabled={isLoading}>Batal</AlertDialogCancel>
        <AlertDialogAction onClick={handleDelete} disabled={isLoading} className="bg-red-600 hover:bg-red-700">
          {isLoading ? "Menghapus..." : "Ya, Hapus Proyek"}
        </AlertDialogAction>
      </AlertDialogFooter>
    </AlertDialogContent>
  );
}