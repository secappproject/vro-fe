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