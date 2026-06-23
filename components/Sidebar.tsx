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
    <aside className="flex flex-col w-56 shrink-0 border-r bg-background h-screen sticky top-0">
      <div className="flex items-center gap-2.5 px-5 py-5 border-b">
        <Leaf className="h-5 w-5 text-green-600" />
        <span className="font-semibold text-sm">Oyinkan Tracker</span>
      </div>

      <nav className="flex-1 px-3 py-4 space-y-0.5">
        {navItems.map(({ href, label, icon: Icon }) => {
          const active = pathname === href;
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-md text-sm transition-colors",
                active
                  ? "bg-primary text-primary-foreground font-medium"
                  : "text-muted-foreground hover:bg-muted hover:text-foreground"
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>

      <div className="px-3 py-4 border-t">
        <Button
          variant="ghost"
          size="sm"
          className="w-full justify-start gap-3 text-muted-foreground text-sm"
          onClick={() => signOut({ callbackUrl: "/login" })}
        >
          <LogOut className="h-4 w-4" />
          Sign out
        </Button>
      </div>
    </aside>
  );
}