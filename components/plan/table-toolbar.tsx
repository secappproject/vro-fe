"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Dialog } from "@/components/ui/dialog";
import { AddProjectModal } from "./add-project-modal";
import { ImportExcelModal } from "./import-excel-modal";
import { Project, useAuthStore } from "@/lib/types";
import * as XLSX from "xlsx";
import { Plus, FileUp, FileDown } from "lucide-react";

interface TableToolbarProps {
  data: Project[];
}

export function TableToolbar({ data }: TableToolbarProps) {
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isImportModalOpen, setIsImportModalOpen] = useState(false);
  const router = useRouter();
  const role = useAuthStore((state) => state.role);
  const vendorType = useAuthStore((state) => state.vendorType);
  const isVendorPanel = vendorType === "Panel" || vendorType === "panel"; 
  const isAdmin = role === "Admin" || role === "admin";
  
  const canManageProjects = isAdmin || isVendorPanel;

  const handleExport = () => {
    const dataToExport = data.map((p) => ({
      "Project Name": p.projectName,
      "WBS": p.wbs,
      "Category": p.category,
      "Qty": p.quantity,
      "Vendor Panel": p.vendorPanel,
      "Vendor Busbar": p.vendorBusbar,
      "Progress Panel": p.panelProgress,
      "Status Busbar": p.statusBusbar,
      "Plan Start": p.planStart,
      "FAT Start": p.fatStart,
      "Plan Basic Kit (Panel)": p.planDeliveryBasicKitPanel,
      "Plan Basic Kit (Busbar)": p.planDeliveryBasicKitBusbar,
      "Actual Basic Kit (Panel)": p.actualDeliveryBasicKitPanel,
      "Actual Basic Kit (Busbar)": p.actualDeliveryBasicKitBusbar,
      "Plan Accessories (Panel)": p.planDeliveryAccessoriesPanel,
      "Plan Accessories (Busbar)": p.planDeliveryAccessoriesBusbar,
      "Actual Accessories (Panel)": p.actualDeliveryAccessoriesPanel,
      "Actual Accessories (Busbar)": p.actualDeliveryAccessoriesBusbar,
      "Created At": p.createdAt,
      "Updated At": p.updatedAt,
    }));

    const worksheet = XLSX.utils.json_to_sheet(dataToExport);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, "Projects");
    XLSX.writeFile(workbook, "ProjectPlanData.xlsx");
  };

  const handleImportSuccess = () => {
    router.refresh();
    setIsImportModalOpen(false);
  };

  return (
    <div className="flex items-center justify-end gap-2 py-4">
      {canManageProjects && (
        <>
          <Dialog open={isAddModalOpen} onOpenChange={setIsAddModalOpen}>
            <Button onClick={() => setIsAddModalOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Tambah Proyek
            </Button>
            <AddProjectModal setIsOpen={setIsAddModalOpen} />
          </Dialog>

          <Button variant="outline" onClick={() => setIsImportModalOpen(true)}>
            <FileUp className="mr-2 h-4 w-4" />
            Impor Excel
          </Button>

          <ImportExcelModal
            isOpen={isImportModalOpen}
            onClose={() => setIsImportModalOpen(false)}
            onSuccess={handleImportSuccess}
          />
        </>
      )}

      <Button variant="outline" onClick={handleExport}>
        <FileDown className="mr-2 h-4 w-4" />
        Ekspor Excel
      </Button>
    </div>
  );
}