"use client";

import { PlanDataTable } from "@/components/plan/data-table";
import { columns } from "@/components/plan/columns";
import { Project, useAuthStore } from "@/lib/types";
import { useEffect, useMemo, useState } from "react";

async function getPlanData(role: string): Promise<Project[]> {
  try {
    const apiUrl = `${process.env.NEXT_PUBLIC_API_URL}/api/projects/`;
    const res = await fetch(apiUrl, {
      headers: {
        'X-User-Role': role,
      },
    });
    if (!res.ok) {
      console.error("Failed to fetch plan data:", res.statusText);
      return [];
    }
    return res.json();
  } catch (error) {
    console.error("Error fetching plan data:", error);
    return [];
  }
}
export default function PlanPage() {
  const [data, setData] = useState<Project[]>([]);
  const role = useAuthStore((state) => state.role);
  const companyName = useAuthStore((state) => state.companyName); 

  useEffect(() => {
    if (role) {
      getPlanData(role).then(setData);
    }
  }, [role]); 

  const filteredData = useMemo(() => {
    if (!role || !data) return []; 

    const isVendor = role === "External/Vendor";

    if (isVendor && companyName) {
      return data.filter(project => 
        project.vendorPanel === companyName || 
        project.vendorBusbar === companyName
      );
    }
    
    return data;

  }, [data, role, companyName]); 


  return (
    <div className="container mx-auto py-10">
      <h1 className="text-3xl mb-4">Project Plan</h1>
      <p className="text-muted-foreground mb-6 font-light">
        Daftar proyek yang sedang dalam tahap perencanaan.
      </p>
      <PlanDataTable
        columns={columns}
        data={filteredData} 
      />
    </div>
  );
}