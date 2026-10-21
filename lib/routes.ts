// Sumber tunggal "role mana boleh membuka halaman mana".
// Dipakai oleh sidebar (menu yang tampil) DAN AuthProvider (penjaga halaman), supaya
// keduanya tidak pernah berbeda. Sebelumnya aturan ini hanya ada di sidebar, jadi
// user bisa membuka halaman yang tidak ada di menunya dengan mengetik URL langsung
// (data tetap aman karena API menolak, tapi halamannya tampil kosong/error).

import {
  BUSBAR_ROLES,
  BUSBAR_VENDOR_ROLES,
  SUPERMARKET_VENDOR_ROLE,
} from "@/lib/roles";

const ALL_ROLES: readonly string[] = [
  "Superuser",
  "Admin",
  "Vendor",
  "Viewer",
  ...BUSBAR_ROLES,
  SUPERMARKET_VENDOR_ROLE,
];

const SUMMARY_ROLES: readonly string[] = [
  "Superuser",
  "Admin",
  "Vendor",
  "Viewer",
  SUPERMARKET_VENDOR_ROLE,
];

/**
 * Halaman yang dibatasi. `path` cocok persis, atau sebagai awalan (mis. "/materials"
 * juga mencakup "/materials/123"). Halaman yang tidak terdaftar di sini TIDAK dibatasi.
 */
export const ROUTE_ACCESS: ReadonlyArray<{ path: string; allowedRoles: readonly string[] }> = [
  { path: "/materials", allowedRoles: ALL_ROLES },
  { path: "/dashboard-rpl", allowedRoles: SUMMARY_ROLES },
  // Dashboard Supplier/Schneider Stock dibuka dari tombol di Dashboard Summary.
  { path: "/dashboard-supplier", allowedRoles: SUMMARY_ROLES },
  { path: "/dashboard-busbar", allowedRoles: ["Superuser", "Admin", ...BUSBAR_ROLES] },
  { path: "/vendors", allowedRoles: ["Superuser", "Admin"] },
  // Viewer busbar hanya boleh Rpl. Stock Monitoring & Dashboard Busbar.
  {
    path: "/profile",
    allowedRoles: ["Superuser", "Admin", "Vendor", "Viewer", ...BUSBAR_VENDOR_ROLES, SUPERMARKET_VENDOR_ROLE],
  },
];

/** Halaman awal yang selalu boleh dibuka semua role (Rpl. Stock Monitoring). */
export const HOME_PATH = "/";

const matches = (pathname: string, path: string) =>
  pathname === path || pathname.startsWith(path + "/");

/** Daftar role yang boleh membuka `path` (untuk sidebar). */
export const allowedRolesFor = (path: string): readonly string[] =>
  ROUTE_ACCESS.find((r) => r.path === path)?.allowedRoles ?? ALL_ROLES;

/** Apakah `role` boleh membuka `pathname`. Halaman yang tidak terdaftar selalu boleh. */
export const canAccessPath = (role: string | null | undefined, pathname: string): boolean => {
  if (pathname === HOME_PATH) return true;
  const rule = ROUTE_ACCESS.find((r) => matches(pathname, r.path));
  if (!rule) return true;
  return !!role && rule.allowedRoles.includes(role);
};
