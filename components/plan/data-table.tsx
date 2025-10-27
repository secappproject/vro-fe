"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../reusable-datatable/data-table"; 
import { Project } from "@/lib/types"; 

interface DataTableProps<TData extends Project, TValue> { 
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

export function PlanDataTable<TData extends Project, TValue>({ 
  columns, 
  data 
}: DataTableProps<TData, TValue>) {
  return (
    <div>
       <DataTable columns={columns} data={data} />
    </div>
  );
}