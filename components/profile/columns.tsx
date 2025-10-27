"use client";

import { ColumnDef, FilterFn } from "@tanstack/react-table";
import { User } from "@/lib/types";
import { DataTableColumnHeader } from "../reusable-datatable/column-header";
import { Badge } from "@/components/ui/badge";
import { DataTableRowActions } from "./row-actions";

type UserUpdateHandler = (updatedUser: User) => void;
type UserDeleteHandler = (userId: number) => void;

type NullString = {
  String: string;
  Valid: boolean;
};

const getDisplayValueFromNullString = (val: NullString | null): string => {
  if (val === null || !val.Valid) {
    return "(Kosong)";
  }
  return val.String;
};

const nullStringFilterFn: FilterFn<User> = (row, id, filterValue) => {
  const selectedValues = filterValue as string[];
  if (selectedValues.length === 0) return true;

  const rowValue = row.getValue(id) as NullString | null;

  const displayValue = getDisplayValueFromNullString(rowValue);

  return selectedValues.includes(displayValue);
};
export const getColumns = (
  onUserUpdated: UserUpdateHandler,
  onUserDeleted: UserDeleteHandler
): ColumnDef<User>[] => [
  {
    id: "no",
    header: "No.",
    cell: ({ row }) => <span>{row.index + 1}</span>,
    enableSorting: false,
    enableHiding: false,
  },
  {
    accessorKey: "username",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Username" />
    ),
    cell: ({ row }) => {
      return <span>{row.getValue("username")}</span>;
    },
  },
  {
    accessorKey: "role",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Role" />
    ),
    cell: ({ row }) => {
      const role = row.getValue("role") as string;
      return <Badge variant={"secondary"}>{role}</Badge>;
    },
    filterFn: (row, id, value) => {
      return value.includes(row.getValue(id));
    },
  },
  {
    accessorKey: "companyName",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Nama Perusahaan" />
    ),
    cell: ({ row }) => {
      const company = row.getValue("companyName") as NullString;
      return company.Valid ? (
        company.String
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    filterFn: nullStringFilterFn,
  },
  {
    accessorKey: "vendorType",
    header: ({ column }) => (
      <DataTableColumnHeader column={column} title="Tipe Vendor" />
    ),
    cell: ({ row }) => {
      const vendor = row.getValue("vendorType") as NullString;
      return vendor.Valid ? (
        vendor.String
      ) : (
        <span className="text-muted-foreground">-</span>
      );
    },
    filterFn: nullStringFilterFn,
  },
  {
    id: "actions",
    cell: ({ row }) => (
      <DataTableRowActions
        user={row.original}
        onUserUpdated={onUserUpdated}
        onUserDeleted={onUserDeleted}
      />
    ),
  },
];