"use client"; 
import {
  ColumnDef,
  SortingState,
  ColumnFiltersState,
  VisibilityState,
  flexRender,
  getCoreRowModel,
  getFacetedRowModel,
  getFacetedUniqueValues,
  getFilteredRowModel,
  getPaginationRowModel,
  getSortedRowModel,
  useReactTable,
  FilterFn,
} from "@tanstack/react-table";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Material, useAuthStore } from "@/lib/types";
import { Input } from "@/components/ui/input";
import { UnfoldHorizontalIcon, X, Download } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { DataTableFacetedFilter } from "./data-table-faceted-filter";
import React from "react";

import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

interface DataTableProps<TData extends Material, TValue> {
  columns: ColumnDef<TData, TValue>[];
  data: TData[];
}

interface LastDownloadInfo {
  username: string;
  timestamp: string; 
}

const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

export function MaterialDataTable<TData extends Material, TValue>({
  columns,
  data,
}: DataTableProps<TData, TValue>) {
  const [sorting, setSorting] = React.useState<SortingState>([]);
  const [columnFilters, setColumnFilters] = React.useState<ColumnFiltersState>(
    []
  );

  const [columnVisibility, setColumnVisibility] =
    React.useState<VisibilityState>({
      minBinQty: false,
      packQuantity: false,
      maxBinQty: false,
      totalBins: false,
      pic: false,
    });

  const [globalFilter, setGlobalFilter] = React.useState("");
  const [inputValue, setInputValue] = React.useState("");
  const [filterChips, setFilterChips] = React.useState<string[]>([]);

  const [exportFormat, setExportFormat] = React.useState<"csv" | "pdf">("csv");
  const [pdfOrientation, setPdfOrientation] = React.useState<
    "portrait" | "landscape"
  >("portrait");

  const [lastDownloadInfo, setLastDownloadInfo] =
    React.useState<LastDownloadInfo | null>(null);

  const username = useAuthStore((state) => state.username);
  const role = useAuthStore((state) => state.role);
  const companyName = useAuthStore((state) => state.companyName);

  const authHeaders = {
    "X-User-Role": role || "",
    "X-User-Company": companyName || "",
    "Content-Type": "application/json",
  };

  const multiWordFilterFn: FilterFn<TData> = (row, _columnId, filterValue) => {
    const filterWords = String(filterValue)
      .toLowerCase()
      .split(" ")
      .filter(Boolean);
    if (filterWords.length === 0) return true;

    const rowText = row
      .getVisibleCells()
      .map((cell) => String(cell.getValue() ?? ""))
      .join(" ")
      .toLowerCase();

    return filterWords.every((word) => rowText.includes(word));
  };

  const table = useReactTable<TData>({
    data,
    columns,
    state: {
      sorting,
      columnFilters,
      globalFilter,
      columnVisibility,
    },
    filterFns: {
      multiWord: multiWordFilterFn,
    },
    globalFilterFn: multiWordFilterFn,
    onGlobalFilterChange: setGlobalFilter,
    onSortingChange: setSorting,
    onColumnFiltersChange: setColumnFilters,
    onColumnVisibilityChange: setColumnVisibility,
    getCoreRowModel: getCoreRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getFacetedRowModel: getFacetedRowModel(),
    getFacetedUniqueValues: getFacetedUniqueValues(),
    getSortedRowModel: getSortedRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const minBinQtyColumn = table.getColumn("minBinQty");
  const packQuantityColumn = table.getColumn("packQuantity");
  const maxBinQtyColumn = table.getColumn("maxBinQty");
  const totalBinsColumn = table.getColumn("totalBins");
  const currentQuantityColumn = table.getColumn("currentQuantity");
  const productTypeColumn = table.getColumn("productType");

  React.useEffect(() => {
    const chipsString = filterChips.join(" ");
    const liveInputString = inputValue.trim().toLowerCase();
    const combinedFilter = [chipsString, liveInputString]
      .filter(Boolean)
      .join(" ");
    table.setGlobalFilter(combinedFilter);
  }, [filterChips, inputValue, table]);

  const fetchLastDownload = React.useCallback(async () => {
    try {
      const response = await fetch(`${API_URL}/api/logs/last-download`, {
        method: "GET",
        headers: authHeaders,
      });
      if (response.ok) {
        const data = await response.json();
        setLastDownloadInfo(data); 
      } else {
        console.error("Gagal mengambil log download terakhir");
      }
    } catch (error) {
      console.error("Error fetching last download:", error);
    }
  }, [role, companyName]); 
  
  React.useEffect(() => {
    fetchLastDownload();
  }, [fetchLastDownload]);

  const handleKeyDown = (event: React.KeyboardEvent<HTMLInputElement>) => {
    const newChip = inputValue.trim().toLowerCase();
    if (event.key === "Enter" && newChip !== "") {
      event.preventDefault();
      if (!filterChips.includes(newChip)) {
        setFilterChips((prev) => [...prev, newChip]);
      }
      setInputValue("");
    }
  };

  const removeChip = (chipToRemove: string) => {
    setFilterChips((prev) => prev.filter((chip) => chip !== chipToRemove));
  };

  const isFiltered =
    filterChips.length > 0 || table.getState().columnFilters.length > 0;

  const resetFilters = () => {
    table.resetColumnFilters();
    setFilterChips([]);
    setInputValue("");
    table.setGlobalFilter(undefined);
  };

  const handleDownload = async () => {
    const rows = table.getFilteredRowModel().rows;
    if (rows.length === 0) {
      alert("Tidak ada data terfilter untuk diekstrak.");
      return;
    }

    const now = new Date();
    const filenameTimestamp = now.toISOString().split("T")[0];
    const reportTimestamp = now.toLocaleString("id-ID", {
      dateStyle: "full",
      timeStyle: "long",
    });


    const headers = [
      "Kode Material",
      "Deskripsi",
      "SoH (Total Stok)",
      "Replenishment (Bin Kosong)",
      "Remark",
      "Vendor",
      "Vendor Stock",
      "Lokasi",
      "Tipe",
      "Min Qty",
      "Pack Qty",
      "Max Qty",
      "Total Bins",
      "PIC",
      "Rincian Stok Bin",
    ];

    const dataToExport = rows.map((row) => {
      const original = row.original;
      let binDetails = "-";
      if (
        original.productType !== "kanban" &&
        original.bins &&
        original.bins.length > 0
      ) {
        binDetails = original.bins
          .map((b) => `Bin ${b.binSequenceId}: ${b.currentBinStock}`)
          .join(" | ");
      } else if (original.productType === "kanban") {
        binDetails = "Kanban System";
      }

      return [
        row.getValue("material"),
        row.getValue("materialDescription"),
        row.getValue("soh"),
        row.getValue("replenishment"),
        row.getValue("remark"),
        row.getValue("vendorCode"),
        row.getValue("vendorStock"),
        row.getValue("lokasi"),
        row.getValue("productType"),
        row.getValue("minBinQty"),
        row.getValue("packQuantity"),
        row.getValue("maxBinQty"),
        row.getValue("totalBins"),
        row.getValue("pic"),
        binDetails,
      ];
    });

    if (exportFormat === "csv") {
      const escapeCsvCell = (cell: unknown) => {
        const str = String(cell ?? "");
        if (str.includes(",") || str.includes('"') || str.includes("\n")) {
          return `"${str.replace(/"/g, '""')}"`;
        }
        return str;
      };

      let csvContent = headers.join(",") + "\n";
      dataToExport.forEach((rowArray) => {
        csvContent += rowArray.map(escapeCsvCell).join(",") + "\n";
      });

      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `material_extract_${filenameTimestamp}.csv`
      );
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } else if (exportFormat === "pdf") {
      const doc = new jsPDF(pdfOrientation, "pt", "a4");

      doc.setFontSize(16);
      doc.text("Laporan Ekstrak Material", 40, 40);
      doc.setFontSize(10);
      doc.setTextColor(100);
      doc.text(`Diekstrak pada: ${reportTimestamp}`, 40, 55);

      autoTable(doc, {
        startY: 70,
        head: [headers],
        body: dataToExport.map((row) => row.map((cell) => String(cell ?? "-"))),
        theme: "striped",
        headStyles: { fillColor: [38, 38, 38] },
        styles: {
          fontSize: 7,
          cellPadding: 2,
        },
        alternateRowStyles: {
          fillColor: [245, 245, 245],
        },
      });

      doc.save(`material_extract_${filenameTimestamp}.pdf`);
    }

    if (username) {
      try {
        await fetch(`${API_URL}/api/logs/download`, {
          method: "POST",
          headers: authHeaders,
          body: JSON.stringify({ username: username }),
        });
        fetchLastDownload();
      } catch (error) {
        console.error("Gagal mencatat log download:", error);
      }
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between gap-4">
        <div className="flex flex-col gap-2 w-full max-w-lg">
          {/* ... (Input filter Anda tidak berubah) ... */}
          <div className="flex items-center gap-2">
            <Input
              type="text"
              placeholder={
                filterChips.length === 0
                  ? "Cari, lalu tekan Enter..."
                  : "Tambah filter..."
              }
              value={inputValue}
              onChange={(e) => setInputValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="flex-grow"
            />
            {isFiltered && (
              <Button
                variant="ghost"
                onClick={resetFilters}
                className="h-9 px-2 lg:px-3"
              >
                Reset <X className="ml-2 h-4 w-4" />
              </Button>
            )}
          </div>
          {filterChips.length > 0 && (
            <div className="flex flex-wrap items-center gap-1">
              {filterChips.map((chip) => (
                <div
                  key={chip}
                  className="flex items-center gap-1 bg-secondary text-secondary-foreground rounded-full px-2 py-0.5 text-sm"
                >
                  <span>{chip}</span>
                  <button
                    onClick={() => removeChip(chip)}
                    className="rounded-full hover:bg-muted/50"
                  >
                    <X className="h-3 w-3" />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <div className="flex flex-row items-center gap-2">
            {/* [DIUBAH] Tampilkan info dari state lastDownloadInfo */}
            {lastDownloadInfo && (
              <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">
                Last Download: {lastDownloadInfo.username} @{" "}
                {new Date(lastDownloadInfo.timestamp).toLocaleString("id-ID", {
                  timeStyle: "short",
                  dateStyle: "short",
                })}
              </span>
            )}
            <AlertDialog>
              <AlertDialogTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  className="ml-auto hidden h-9 lg:flex"
                >
                  <Download className="mr-2 h-4 w-4" />
                  Extract
                </Button>
              </AlertDialogTrigger>
              <AlertDialogContent>
                <AlertDialogHeader>
                  <AlertDialogTitle>Pilih Format Ekstrak</AlertDialogTitle>
                  <AlertDialogDescription>
                    Pilih format file dan orientasi halaman untuk PDF.
                  </AlertDialogDescription>
                </AlertDialogHeader>

                <div className="grid grid-cols-2 gap-4 py-4">
                  {/* ... (Opsi Format File tidak berubah) ... */}
                  <div className="space-y-2">
                    <Label>Format File</Label>
                    <RadioGroup
                      value={exportFormat}
                      onValueChange={(value) =>
                        setExportFormat(value as "csv" | "pdf")
                      }
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="csv" id="r-csv" />
                        <Label htmlFor="r-csv">CSV</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="pdf" id="r-pdf" />
                        <Label htmlFor="r-pdf">PDF</Label>
                      </div>
                    </RadioGroup>
                  </div>
                  <div className="space-y-2">
                    <Label>Orientasi PDF</Label>
                    <RadioGroup
                      value={pdfOrientation}
                      onValueChange={(value) =>
                        setPdfOrientation(value as "portrait" | "landscape")
                      }
                      disabled={exportFormat !== "pdf"}
                    >
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="portrait" id="r-portrait" />
                        <Label htmlFor="r-portrait">Portrait</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <RadioGroupItem value="landscape" id="r-landscape" />
                        <Label htmlFor="r-landscape">Landscape</Label>
                      </div>
                    </RadioGroup>
                  </div>
                </div>

                <AlertDialogFooter>
                  <AlertDialogCancel>Batal</AlertDialogCancel>
                  {/* [DIUBAH] Panggil handleDownload saat di-klik */}
                  <AlertDialogAction onClick={handleDownload}>
                    Download
                  </AlertDialogAction>
                </AlertDialogFooter>
              </AlertDialogContent>
            </AlertDialog>
          </div>

          <DropdownMenu>
            {/* ... (Dropdown View Anda tidak berubah) ... */}
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                size="sm"
                className="hidden h-9 lg:flex"
              >
                <UnfoldHorizontalIcon className="mr-2 h-4 w-4" />
                View
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-[180px]">
              <DropdownMenuLabel>Toggle kolom</DropdownMenuLabel>
              <DropdownMenuSeparator />
              {table
                .getAllLeafColumns()
                .filter((column) => column.getCanHide())
                .map((column) => {
                  return (
                    <DropdownMenuCheckboxItem
                      key={column.id}
                      className="capitalize"
                      checked={column.getIsVisible()}
                      onCheckedChange={(value) =>
                        column.toggleVisibility(!!value)
                      }
                    >
                      {column.id
                        .replace(/([A-Z])/g, " $1")
                        .replace(/^./, (str) => str.toUpperCase())}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* ... (Filter faceted Anda tidak berubah) ... */}
        {currentQuantityColumn && (
          <DataTableFacetedFilter
            column={currentQuantityColumn}
            title="Stok Bin"
          />
        )}
        {productTypeColumn && (
          <DataTableFacetedFilter column={productTypeColumn} title="Tipe" />
        )}
        {minBinQtyColumn && (
          <DataTableFacetedFilter column={minBinQtyColumn} title="Min Qty" />
        )}
        {packQuantityColumn && (
          <DataTableFacetedFilter
            column={packQuantityColumn}
            title="Pack Qty"
          />
        )}
        {maxBinQtyColumn && (
          <DataTableFacetedFilter column={maxBinQtyColumn} title="Max Qty" />
        )}
        {totalBinsColumn && (
          <DataTableFacetedFilter column={totalBinsColumn} title="Total Bins" />
        )}
      </div>

      <div className="rounded-md border">
        <Table>
          {/* ... (Tabel Header Anda tidak berubah) ... */}
          <TableHeader>
            <TableRow>
              <TableHead
                colSpan={columns.length}
                className="h-10 align-middle"
              >
                <span className="text-sm font-light text-muted-foreground">
                  Total {table.getFilteredRowModel().rows.length} data
                </span>
              </TableHead>
            </TableRow>

            {table.getHeaderGroups().map((headerGroup) => (
              <TableRow key={headerGroup.id}>
                {headerGroup.headers.map((header) => (
                  <TableHead key={header.id}>
                    {header.isPlaceholder
                      ? null
                      : flexRender(
                          header.column.columnDef.header,
                          header.getContext()
                        )}
                  </TableHead>
                ))}
              </TableRow>
            ))}
          </TableHeader>
          {/* ... (Tabel Body Anda tidak berubah) ... */}
          <TableBody>
            {table.getRowModel().rows?.length ? (
              table.getRowModel().rows.map((row) => (
                <TableRow
                  key={row.id}
                  data-state={row.getIsSelected() && "selected"}
                >
                  {row.getVisibleCells().map((cell) => (
                    <TableCell className="font-light" key={cell.id}>
                      {flexRender(
                        cell.column.columnDef.cell,
                        cell.getContext()
                      )}
                    </TableCell>
                  ))}
                </TableRow>
              ))
            ) : (
              <TableRow>
                <TableCell
                  colSpan={columns.length}
                  className="h-24 text-center font-light"
                >
                  Tidak ada data.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
      <div className="flex items-center justify-between py-4">
        {/* ... (Paginasi Anda tidak berubah) ... */}
        <div className="flex items-center space-x-2">
          <p className="text-sm font-light">Baris per halaman:</p>
          <Select
            value={`${table.getState().pagination.pageSize}`}
            onValueChange={(value) => {
              table.setPageSize(Number(value));
            }}
          >
            <SelectTrigger className="h-8 w-[70px]">
              <SelectValue placeholder={table.getState().pagination.pageSize} />
            </SelectTrigger>
            <SelectContent side="top">
              {[10, 15, 20, 25, 30].map((pageSize) => (
                <SelectItem key={pageSize} value={`${pageSize}`}>
                  {pageSize}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="flex items-center space-x-4">
          <div className="flex w-[100px] items-center justify-center text-sm font-light">
            Page {table.getState().pagination.pageIndex + 1} /{" "}
            {table.getPageCount()}
          </div>
          <div className="flex items-center space-x-2">
            <Button
              className="border text-black bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
              size="sm"
              onClick={() => table.previousPage()}
              disabled={!table.getCanPreviousPage()}
            >
              Back
            </Button>
            <Button
              className="border text-black bg-background shadow-xs hover:bg-accent hover:text-accent-foreground dark:bg-input/30 dark:border-input dark:hover:bg-input/50"
              size="sm"
              onClick={() => table.nextPage()}
              disabled={!table.getCanNextPage()}
            >
              Next
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}