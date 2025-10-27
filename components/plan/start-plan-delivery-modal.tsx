"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";
import { Calendar as CalendarIcon } from "lucide-react";

import { cn } from "@/lib/utils"; 
import { Project, useAuthStore } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Label } from "@/components/ui/label";

interface StartPanelDeliveryModalProps {
  project: Project;
  setIsOpen: (open: boolean) => void; 
}

export function StartPanelDeliveryModal({ project, setIsOpen }: StartPanelDeliveryModalProps) {
  const [date, setDate] = useState<Date | undefined>();
  const [isLoading, setIsLoading] = useState(false);
  const router = useRouter();

  const handleSubmit = async () => {
    if (!date) {
      alert("Tanggal Basic Kit harus dipilih.");
      return;
    }

    setIsLoading(true);

    try {
      const basicKitDate = format(date, "yyyy-MM-dd");
      const role = useAuthStore.getState().role;
      
      const response = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/projects/${project.id}/start-panel-delivery`,
        {
          method: "PATCH",
          headers: {
              "Content-Type": "application/json",
              "X-User-Role": role || '',
          },
          body: JSON.stringify({ basicKitDate }),
        }
      );
      
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || "Gagal memulai proses pengiriman.");
      }

      setDate(undefined);
      setIsOpen(false); 
      router.refresh();

    } catch (error) {
        console.error("Error submitting:", error);
        alert(error instanceof Error ? error.message : "Terjadi kesalahan.");
    } finally {
        setIsLoading(false);
    }
  };

  return (
    <DialogContent className="sm:max-w-[425px]">
      <DialogHeader>
        <DialogTitle>Start Delivery for {project.projectName}</DialogTitle>
        <DialogDescription>
          Pilih tanggal Basic Kit untuk memulai proses pengiriman. Estimasi
          tanggal pengiriman panel & busbar akan dihitung otomatis (H+2).
        </DialogDescription>
      </DialogHeader>
      <div className="grid gap-4 py-4">
        <div className="grid grid-cols-4 items-center gap-4">
          <Label htmlFor="basic-kit-date" className="text-right">
            Basic Kit Date
          </Label>
          <Popover>
            <PopoverTrigger asChild>
              <Button
                variant={"outline"}
                className={cn(
                  "w-[240px] justify-start text-left font-normal",
                  !date && "text-muted-foreground"
                )}
              >
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date ? format(date, "PPP") : <span>Pilih tanggal</span>}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0">
              <Calendar
                mode="single"
                selected={date}
                onSelect={setDate}
                initialFocus
              />
            </PopoverContent>
          </Popover>
        </div>
      </div>
      <DialogFooter>
        <Button variant="outline" onClick={() => setIsOpen(false)}>
          Batal
        </Button>
        <Button onClick={handleSubmit} disabled={!date || isLoading}>
          {isLoading ? "Memproses..." : "Konfirmasi & Mulai"}
        </Button>
      </DialogFooter>
    </DialogContent>
  );
}