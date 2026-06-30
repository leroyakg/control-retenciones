import { DashboardNav } from "@/components/dashboard-nav";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { LogoutButton } from "@/components/logout-button";
import Link from "next/link";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen flex">
      <aside className="hidden md:flex w-60 shrink-0 flex-col border-r border-foreground/10 p-4">
        <Link href="/dashboard" className="px-3 py-2 font-semibold">
          Control de Retenciones
        </Link>
        <div className="mt-6 flex-1">
          <DashboardNav />
        </div>
        <div className="flex-1 items-center justify-between gap-2 border-t border-foreground/10 pt-4">
          <ThemeSwitcher />
          <LogoutButton />
        </div>
      </aside>

      <main className="flex-1 p-6 lg:p-10">{children}</main>
    </div>
  );
}
