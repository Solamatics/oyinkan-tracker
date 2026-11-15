"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import {
  LayoutDashboard,
  ShoppingCart,
  Receipt,
  Package,
  BarChart3,
  Leaf,
  LogOut,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";

const navItems = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/sales", label: "Sales", icon: ShoppingCart },
  { href: "/expenses", label: "Expenses", icon: Receipt },
  { href: "/inventory", label: "Inventory", icon: Package },
  { href: "/reports", label: "Reports", icon: BarChart3 },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <>
      {/* Desktop sidebar */}
      <aside className="bg-background sticky top-0 hidden h-screen w-56 shrink-0 flex-col border-r md:flex">
        <div className="flex items-center gap-2.5 border-b px-5 py-5">
          <Leaf className="h-5 w-5 text-green-600" />
          <span className="text-sm font-semibold">Oyinkan Tracker</span>
        </div>

        <nav className="flex-1 space-y-0.5 px-3 py-4">
          {navItems.map(({ href, label, icon: Icon }) => {
            const active = pathname === href;
            return (
              <Link
                key={href}
                href={href}
                className={cn(
                  "flex items-center gap-3 rounded-md px-3 py-2.5 text-sm transition-colors",
                  active
                    ? "bg-primary text-primary-foreground font-medium"
                    : "text-muted-foreground hover:bg-muted hover:text-foreground",
                )}
              >
                <Icon className="h-4 w-4" />
                {label}
              </Link>
            );
          })}
        </nav>

        <div className="border-t px-3 py-4">
          <Button
            variant="ghost"
            size="sm"
            className="text-muted-foreground w-full justify-start gap-3 text-sm"
            onClick={() => signOut({ callbackUrl: "/login" })}
          >
            <LogOut className="h-4 w-4" />
            Sign out
          </Button>
        </div>
      </aside>

      {/* Mobile top bar */}
      <header className="bg-background fixed top-0 right-0 left-0 z-50 flex h-14 items-center justify-between border-b px-4 md:hidden">
        <div className="flex items-center gap-2">
          <Leaf className="h-4 w-4 text-green-600" />
          <span className="text-sm font-semibold">Oyinkan Tracker</span>
        </div>
        <Button
          variant="ghost"
          size="icon"
          className="text-muted-foreground h-8 w-8"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
        </Button>
      </header>

      {/* Mobile bottom nav */}
      <nav className="bg-background fixed right-0 bottom-0 left-0 z-50 flex h-16 items-stretch border-t md:hidden">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-1 flex-col items-center justify-center gap-1 text-[10px] font-medium transition-colors",
                active ? "text-primary" : "text-muted-foreground",
              )}
            >
              <Icon className="h-5 w-5" />
              {label}
            </Link>
          );
        })}
      </nav>
    </>
  );
}
