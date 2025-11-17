import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';

interface UserState {
  username: string | null;
  role: string | null;
  companyName: string | null;
  vendorType: string | null; 
  isLoggedIn: boolean;
  login: (userData: {
    username: string;
    role: string;
    companyName: string | null;
    vendorType: string | null; 
  }) => void;
  logout: () => void;
}

type NullString = {
  String: string;
  Valid: boolean;
};

export type User = {
  id: number;
  username: string;
  role: string;
  companyName: NullString | null;  
  vendorType: NullString | null;  
};

export interface Vendor {
  id: number;
  companyName: string;
  vendorType: string;
  createdAt: string;
  updatedAt: string;
}
export interface MaterialBin {
  id: number;
  materialId: number;
  binSequenceId: number;
  maxBinStock: number;
  currentBinStock: number;
}

export interface Material {
  id: number;
  material: string;
  materialDescription: string;
  lokasi: string; 
  packQuantity: number;
  maxBinQty: number;
  minBinQty: number;
  vendorCode: string;
  currentQuantity: number;
  pic?: string;
  vendorStock?: number;
  productType: 'kanban' | 'consumable' | 'option';
  bins?: MaterialBin[]; 
}

export interface MaterialStatusResponse {
  packQuantity: number;
  maxBinQty: number;
  minBinQty: number;
  currentQuantity: number;
  productType: "kanban" | "consumable" | "option";
  quantityPerBin: number; 
  bins: MaterialBin[] | null; 
  vendorStock: number;
}
export interface GoSqlNullInt {
  Int64: number;
  Valid: boolean;
}

export interface GoSqlNullString {
  String: string;
  Valid: boolean;
}
export interface StockMovement {
  id: number;
  materialId: number;
  materialCode: string;
  movementType: "Edit" | "Scan IN" | "Scan OUT";
  quantityChange: number;
  oldQuantity: number;
  newQuantity: number;
  pic: string;
  notes: GoSqlNullString; 
  binSequenceId: GoSqlNullInt;
  timestamp: string;
}

export const useAuthStore = create<UserState>()(
  persist(
    (set) => ({
      username: null,
      role: null,
      companyName: null,
      vendorType: null, 
      isLoggedIn: false,

      login: (userData) => set({
        username: userData.username,
        role: userData.role,
        companyName: userData.companyName,
        vendorType: userData.vendorType, 
        isLoggedIn: true,
      }),

      logout: () => set({
        username: null,
        role: null,
        companyName: null,
        vendorType: null, 
        isLoggedIn: false,
      }),
    }),
    {
      name: 'auth-storage',
      storage: createJSONStorage(() => localStorage),
    }
  )
);