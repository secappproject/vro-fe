"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuthStore } from "@/lib/types";


const TIMEOUT_MS = 60 * 60 * 1000; 


export function IdleTimer() {
  const router = useRouter();
  const { isLoggedIn, lastActivity, logout, updateActivity } = useAuthStore();

  useEffect(() => {
    
    if (!isLoggedIn) return;

    
    const checkInitialValidity = () => {
      const now = Date.now();
      const timeSinceLastActivity = now - lastActivity;

      if (timeSinceLastActivity > TIMEOUT_MS) {
        
        console.log("Session expired while away.");
        handleLogout();
      }
    };

    checkInitialValidity();

    
    const handleLogout = () => {
      logout();
      router.replace("/login"); 
    };

    
    const interval = setInterval(() => {
      const now = Date.now();
      if (now - lastActivity > TIMEOUT_MS) {
        console.log("Session expired due to inactivity.");
        handleLogout();
      }
    }, 60000); 

    
    const handleUserActivity = () => {
      
      updateActivity();
    };
    
    window.addEventListener("mousemove", handleUserActivity);
    window.addEventListener("keydown", handleUserActivity);
    window.addEventListener("click", handleUserActivity);
    window.addEventListener("scroll", handleUserActivity);

    return () => {
      clearInterval(interval);
      window.removeEventListener("mousemove", handleUserActivity);
      window.removeEventListener("keydown", handleUserActivity);
      window.removeEventListener("click", handleUserActivity);
      window.removeEventListener("scroll", handleUserActivity);
    };
  }, [isLoggedIn, lastActivity, logout, router, updateActivity]);

  return null; 
}