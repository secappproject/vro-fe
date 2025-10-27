"use client";

import { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "@/components/reusable-datatable/data-table"; 
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

interface StageCount {
  stage: string;
  count: number;
}

interface StageSummaryTableProps {
  data: StageCount[];
}

const columns: ColumnDef<StageCount>[] = [
  {
    accessorKey: "stage",
    header: "Tahap Proyek",
  },
  {
    accessorKey: "count",
    header: () => <div className="text-right">Jumlah</div>,
    cell: ({ row }) => {
      return <div className="text-right font-medium">{row.getValue("count")}</div>;
    },
  },
];

export function StageSummaryTable({ data }: StageSummaryTableProps) {
  return (
    <Card className="lg:col-span-1"> 
      <CardHeader>
        <CardTitle>Ringkasan Proyek per Tahap</CardTitle>
      </CardHeader>
      <CardContent>
        <DataTable columns={columns} data={data}/> 
      </CardContent>
    </Card>
  );
}