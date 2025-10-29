"use client";

import { useEffect } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useAuthStore } from '@/lib/types';

export default function AuthProvider({ children }: { children: React.ReactNode }) {
  const isLoggedIn = useAuthStore((state) => state.isLoggedIn);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    if (!isLoggedIn && pathname !== '/login') {
      router.replace('/login');
    }
    else if (isLoggedIn && pathname === '/login') {
         router.replace('/');
    }
  }, [isLoggedIn, pathname, router]);

  if (!isLoggedIn && pathname === '/login') {
      return <>{children}</>;
  }
   if (!isLoggedIn && pathname !== '/login') {
      return null; 
   }

  return <>{children}</>;
}