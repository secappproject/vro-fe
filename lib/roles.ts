// Sumber kebenaran tunggal untuk pengecekan role di frontend.
//
// Sebelumnya tiap komponen menulis sendiri `role === "Vendor"` atau
// `role === "Viewer"`. Waktu role busbar ditambahkan, pengecekan yang tersebar itu
// tidak ikut diperbarui, sehingga viewer busbar sempat kebagian tombol edit/delete
// dan vendor busbar tidak bisa import vendor stock. Semua pengecekan role sebaiknya
// lewat helper di file ini supaya penambahan role berikutnya cukup diubah di satu tempat.

export const BUSBAR_VENDOR_ROLES = ["Vendor_Busbar_T1", "Vendor_Busbar_T2"] as const;
export const BUSBAR_VIEWER_ROLES = ["Viewer_Busbar_T1", "Viewer_Busbar_T2"] as const;

export const BUSBAR_ROLES: readonly string[] = [
  ...BUSBAR_VENDOR_ROLES,
  ...BUSBAR_VIEWER_ROLES,
];

/**
 * Subcontractor supermarket (mis. Abacus): material SEC disimpan di gudang
 * subcontractor. SOH/bin/remark = gudang subcontractor, "Vendor Stock" tampil
 * sebagai "Schneider Stock" (stok di SEC, diisi oleh SEC).
 */
export const SUPERMARKET_VENDOR_ROLE = "Vendor_Supermarket";

/** Semua role yang cuma boleh melihat & mengelola material miliknya sendiri. */
export const VENDOR_ROLES: readonly string[] = [
  "Vendor",
  ...BUSBAR_VENDOR_ROLES,
  SUPERMARKET_VENDOR_ROLE,
];

/** Semua role yang sifatnya read-only. */
export const VIEWER_ROLES: readonly string[] = ["Viewer", ...BUSBAR_VIEWER_ROLES];

type MaybeRole = string | null | undefined;

/** Vendor biasa maupun vendor busbar T1/T2. */
export const isVendorRole = (role: MaybeRole): boolean =>
  !!role && VENDOR_ROLES.includes(role);

/** Viewer biasa maupun viewer busbar T1/T2. Selalu read-only. */
export const isViewerRole = (role: MaybeRole): boolean =>
  !!role && VIEWER_ROLES.includes(role);

/** Khusus role busbar (vendor maupun viewer). */
export const isBusbarRole = (role: MaybeRole): boolean =>
  !!role && BUSBAR_ROLES.includes(role);

/** Viewer busbar T1/T2 — hanya boleh lihat Rpl. Stock Monitoring & Dashboard Busbar. */
export const isBusbarViewerRole = (role: MaybeRole): boolean =>
  !!role && (BUSBAR_VIEWER_ROLES as readonly string[]).includes(role);

/** Vendor busbar T1/T2 (bukan vendor biasa). */
export const isBusbarVendorRole = (role: MaybeRole): boolean =>
  !!role && (BUSBAR_VENDOR_ROLES as readonly string[]).includes(role);

export type BusbarTier = "T1" | "T2";

/**
 * Tier mana saja yang boleh dilihat sebuah role di Dashboard Busbar.
 * - Superuser/Admin/Viewer internal: kedua tier (buat membandingkan T1 vs T2).
 * - Vendor busbar: hanya tier miliknya sendiri.
 * - Viewer busbar: hanya tier lawan (Viewer T1 lihat T2, Viewer T2 lihat T1),
 *   sesuai backend yang memang mengirim material tier lawan.
 * Ini juga menentukan kartu KPI mana yang ditampilkan.
 */
export const visibleBusbarTiers = (role: MaybeRole): BusbarTier[] => {
  switch (role) {
    case "Vendor_Busbar_T1":
      return ["T1"];
    case "Vendor_Busbar_T2":
      return ["T2"];
    case "Viewer_Busbar_T1":
      return ["T2"];
    case "Viewer_Busbar_T2":
      return ["T1"];
    default:
      return ["T1", "T2"];
  }
};

/** Vendor supermarket (subcontractor yang scan in/out di gudangnya sendiri). */
export const isSupermarketRole = (role: MaybeRole): boolean =>
  role === SUPERMARKET_VENDOR_ROLE;

/** vendors.vendor_type untuk subcontractor supermarket (harus sama dengan backend). */
export const SUPERMARKET_VENDOR_TYPE = "Supermarket";

/** Material yang disimpan di gudang subcontractor supermarket. */
export const isSupermarketMaterial = (m: { vendorType?: string | null }): boolean =>
  m.vendorType === SUPERMARKET_VENDOR_TYPE;

/** Label kolom yang bergantung pada jenis gudang. */
export interface StockLabels {
  /** Kolom vendor_stock. */
  vendorStock: string;
  /** Kolom remark stok gudang (SOH vs max bin). */
  remark: string;
  /** Kolom remark vendor (vendor_stock vs SS dari AMU & FMR); rumusnya sama. */
  remarkVendor: string;
}

/**
 * Label kolom yang artinya berubah untuk material supermarket. Data & rumusnya sama;
 * hanya sudut pandangnya: SOH/remark = gudang subcontractor, vendor stock = stok di
 * Schneider (SEC). Nama label supermarket sesuai arahan mentor (Okt 2026).
 */
export const stockLabelsForView = (supermarket: boolean): StockLabels =>
  supermarket
    ? { vendorStock: "Schneider Stock", remark: "Remark Supermarket", remarkVendor: "Remark Schneider" }
    : { vendorStock: "Vendor Stock", remark: "Remark SEC", remarkVendor: "Remark Vendor" };

export const stockLabels = (role: MaybeRole) =>
  stockLabelsForView(isSupermarketRole(role));

/**
 * Role internal Schneider yang melihat material semua vendor (Superuser/Admin/Viewer).
 * Mereka mendapat pilihan tampilan "WHS SEC | Supermarket".
 */
export const isInternalRole = (role: MaybeRole): boolean =>
  !!role && !isVendorRole(role) && !isBusbarViewerRole(role);
