"use client";

import "./globals.css"
import { Lexend, JetBrains_Mono } from "next/font/google"
import { cn } from "@/lib/utils"
import { Sidebar } from "@/components/sidebar"
import { Header } from "@/components/header"
import * as React from "react"
import { usePathname } from "next/navigation"
import AuthProvider from "@/components/auth-provider";

const lexend = Lexend({
  subsets: ["latin"],
  variable: "--font-geist-sans",
})

const jetbrains = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-geist-mono",
})

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = React.useState(false)
  const pathname = usePathname()
  const toggleSidebar = () => setIsSidebarCollapsed(!isSidebarCollapsed)

  const isLoginPage = pathname === "/login"

  return (
    <html
      lang="en"
      className={cn(lexend.variable, jetbrains.variable)} 
      suppressHydrationWarning
    >
      <body>
        <AuthProvider>
          {isLoginPage ? (
            <main className="min-h-screen bg-white dark:bg-gray-900">
              {children}
            </main>
          ) : (
            <div
              className={cn(
                "flex flex-col min-w-0 md:grid md:min-h-screen min-w-0 md:transition-[grid-template-columns] duration-300 ease-in-out",
                isSidebarCollapsed ? "md:grid-cols-[72px_1fr]" : "md:grid-cols-[288px_1fr]"
              )}
            >
              <Sidebar isCollapsed={isSidebarCollapsed} />
              <div className="flex flex-col bg-white dark:bg-gray-900">
                <Header toggleSidebar={toggleSidebar} isSidebarCollapsed={isSidebarCollapsed} />
                
                <main className="flex flex-1 flex-col p-6">
                  {children}
                </main>
              </div>
            </div>
          )}
        </AuthProvider>
      </body>
    </html>
  )
}
