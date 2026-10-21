"use client";

import { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/types';
import { canAccessPath, HOME_PATH } from '@/lib/routes';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const role = useAuthStore((state) => state.role);
  const router = useRouter();
  const pathname = usePathname();
  
  
  const [isMounted, setIsMounted] = useState(false);

  useEffect(() => {
    setIsMounted(true);
  }, []);

  // Role yang sudah login tapi membuka halaman di luar haknya (mis. viewer busbar
  // mengetik /vendors langsung di URL). Aturannya di lib/routes.ts.
  const isForbiddenPage = isLoggedIn && pathname !== '/login' && !canAccessPath(role, pathname);

  useEffect(() => {
    
    if (!isMounted) return;

    if (!isLoggedIn && pathname !== '/login') {
      router.replace('/login');
    }
    else if (isLoggedIn && pathname === '/login') {
      
      router.replace('/'); 
    }
    else if (isForbiddenPage) {
      router.replace(HOME_PATH);
    }
  }, [isLoggedIn, pathname, router, isMounted, isForbiddenPage]);

  
  
  if (!isMounted) {
    return null; 
  }

  if (!isLoggedIn && pathname === '/login') {
      return <>{children}</>;
  }
  
  
  if (!isLoggedIn && pathname !== '/login') {
      return null; 
  }

  // Jangan tampilkan halaman terlarang sesaat sebelum redirect selesai.
  if (isForbiddenPage) {
      return null;
  }

  return <>{children}</>;
}
