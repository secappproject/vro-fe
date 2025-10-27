"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { cn } from "@/lib/utils";
import { LayoutGrid, Truck, PackageCheck, User, PencilRuler } from "lucide-react";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { useAuthStore } from "@/lib/types";

interface SidebarProps {
  isCollapsed: boolean;
}

export function Sidebar({ isCollapsed }: SidebarProps) {
  const pathname = usePathname();
  const { username, role, companyName } = useAuthStore();

  const allNavLinks = [
    { href: "/dashboard", label: "Dashboard", icon: LayoutGrid, allowedRoles: ['Admin'] },
    { href: "/plan", label: "Panel Plan", icon: PencilRuler, allowedRoles: ['Admin', 'PIC', 'Production Planning', 'External/Vendor'] },
    { href: "/profile", label: "Profil", icon: User, allowedRoles: ['Admin', 'PIC', 'Production Planning', 'External/Vendor'] },
  ];

  const navLinks = allNavLinks.filter(link => role && link.allowedRoles.includes(role));

  const userInitial = username ? username.charAt(0).toUpperCase() : "G";
  const displayName = role === 'External/Vendor' ? companyName : username;
  const displayRole = role === 'External/Vendor' ? `Vendor (${companyName})` : role;


  return (
    <TooltipProvider delayDuration={0}>
      <aside
        className={cn(
          "hidden flex-col border-r bg-white sm:flex dark:bg-gray-950 transition-[width] duration-300 ease-in-out",
          isCollapsed ? "w-[72px]" : "w-72"
        )}
      >
        <div className="flex h-full flex-col justify-between p-4">
          <div>
            <div className={cn("mb-8 px-2", isCollapsed && "hidden px-0 text-center")}>
              <p className={cn("text-sm text-gray-500", isCollapsed && "hidden")}>Selamat Datang,</p>
              <h2 className={cn("text-2xl truncate", isCollapsed && "text-xl")}>
                 {`${displayName} 👋`}
              </h2>
            </div>
            <nav className="flex flex-col gap-2">
              {navLinks.map((link) =>
                isCollapsed ? (
                  <Tooltip key={link.href}>
                    <TooltipTrigger asChild>
                      <Link
                        href={link.href}
                        className={cn(
                          "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 font-light transition-all hover:bg-gray-100 hover:text-black",
                          (pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))) && "bg-gray-100 text-[#008A15] font-light"
                        )}
                      >
                        <link.icon className="h-5 w-5" />
                        <span className="sr-only">{link.label}</span>
                      </Link>
                    </TooltipTrigger>
                    <TooltipContent side="right">{link.label}</TooltipContent>
                  </Tooltip>
                ) : (
                  <Link
                    key={link.href}
                    href={link.href}
                    className={cn(
                      "flex items-center gap-3 rounded-lg px-3 py-2 text-gray-600 transition-all hover:bg-gray-100 hover:text-black font-light",
                      (pathname === link.href || (link.href !== "/" && pathname.startsWith(link.href))) && "bg-gray-100 text-[#008A15] font-light"
                    )}
                  >
                    <link.icon className="h-5 w-5" />
                    {link.label}
                  </Link>
                )
              )}
            </nav>
          </div>
          <div className="flex items-center gap-4 mt-4 border-t pt-4"> 
            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#008A15] text-white flex-shrink-0">
              <span className="text-lg">{userInitial}</span>
            </div>
            <div className={cn("overflow-hidden", isCollapsed && "hidden")}>
              <p className="truncate">{displayName || "Guest"}</p>
              <p className="text-sm text-gray-500 truncate">{displayRole || "Unknown Role"}</p>
            </div>
          </div>
        </div>
      </aside>
    </TooltipProvider>
  );
}