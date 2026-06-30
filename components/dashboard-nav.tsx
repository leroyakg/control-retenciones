"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Bell,
  BarChart3,
  Building2,
  FilePlus,
  History,
  Home,
  ScrollText,
  Truck,
} from "lucide-react";
import { cn } from "@/lib/utils";

const items = [
  { href: "/dashboard", label: "Inicio", icon: Home },
  { href: "/dashboard/nueva", label: "Nueva Retención", icon: FilePlus },
  { href: "/dashboard/historial", label: "Historial", icon: History },
  { href: "/dashboard/cai", label: "CAI", icon: ScrollText },
  { href: "/dashboard/empresas", label: "Empresas", icon: Building2 },
  { href: "/dashboard/proveedores", label: "Proveedores", icon: Truck },
  { href: "/dashboard/alertas", label: "Alertas", icon: Bell },
  { href: "/dashboard/reportes", label: "Reportes", icon: BarChart3 },
];

export function DashboardNav() {
  const pathname = usePathname();

  return (
    <nav className="flex flex-col gap-1">
      {items.map(({ href, label, icon: Icon }) => {
        const active =
          href === "/dashboard"
            ? pathname === href
            : pathname.startsWith(href);

        return (
          <Link
            key={href}
            href={href}
            className={cn(
              "flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors",
              active
                ? "bg-accent font-medium text-accent-foreground"
                : "text-foreground/60 hover:bg-accent/50 hover:text-foreground",
            )}
          >
            <Icon className="size-4" />
            {label}
          </Link>
        );
      })}
    </nav>
  );
}
