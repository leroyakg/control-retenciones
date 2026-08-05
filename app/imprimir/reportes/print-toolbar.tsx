"use client";

import Link from "next/link";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Printer } from "lucide-react";

export function PrintToolbar({ backHref }: { backHref: string }) {
  return (
    <div className="print:hidden mb-6 flex items-center justify-between">
      <Button asChild variant="ghost">
        <Link href={backHref}>
          <ArrowLeft className="size-4" />
          Volver
        </Link>
      </Button>
      <Button type="button" onClick={() => window.print()}>
        <Printer className="size-4" />
        Guardar como PDF
      </Button>
    </div>
  );
}
