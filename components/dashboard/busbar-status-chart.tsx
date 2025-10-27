// "use client";

// import { ColumnDef } from "@tanstack/react-table";
// import {
//   Card,
//   CardContent,
//   CardHeader,
//   CardTitle,
// } from "@/components/ui/card";
// import { DataTableSimple } from "../reusable-datatable/data-table-simple";

// // Tipe data yang diterima dari backend
// interface StageCount {
//   stage: string;
//   count: number;
// }

// interface StageSummaryTableProps {
//   data: StageCount[];
// }

// // Definisikan kolom untuk tabel ringkasan
// const columns: ColumnDef<StageCount>[] = [
//   {
//     accessorKey: "stage",
//     header: "Tahap Proyek",
//   },
//   {
//     accessorKey: "count",
//     header: () => <div className="text-right">Jumlah</div>,
//     cell: ({ row }) => {
//       return <div className="text-right font-medium">{row.getValue("count")}</div>;
//     },
//   },
// ];

// export function StageSummaryTable({ data }: StageSummaryTableProps) {
//   return (
//     <Card className="xl:col-span-2">
//       <CardHeader>
//         <CardTitle>Ringkasan Proyek per Tahap</CardTitle>
//       </CardHeader>
//       <CardContent>
//         <DataTableSimple columns={columns} data={data} />
//       </CardContent>
//     </Card>
//   );
// }
