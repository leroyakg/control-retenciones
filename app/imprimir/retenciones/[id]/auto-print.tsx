"use client";

import { useEffect, useState, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, Printer } from "lucide-react";

export function AutoPrint() {
  useEffect(() => {
    const id = setTimeout(() => window.print(), 200);
    return () => clearTimeout(id);
  }, []);

  return null;
}

type CopyType = "original" | "copia1" | "copia2";

const PRINT_OPTIONS: { type: CopyType; label: string }[] = [
  { type: "original", label: "Imprimir original y Cerrar" },
  { type: "copia1", label: "Imprimir copia 1" },
  { type: "copia2", label: "Imprimir copia 2" },
];

export function PrintControls({ children }: { children: ReactNode }) {
  const [copyType, setCopyType] = useState<CopyType>("original");

  function handlePrint(type: CopyType) {
    setCopyType(type);
    // Espera a que el estado se aplique al DOM antes de abrir el diálogo de impresión.
    requestAnimationFrame(() => window.print());
  }

  return (
    <>
      <div className="print:hidden mb-6 flex items-center justify-end">
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button type="button">
              <Printer className="size-4" />
              Imprimir
              <ChevronDown className="size-4" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            {PRINT_OPTIONS.map((option) => (
              <DropdownMenuItem
                key={option.type}
                onClick={() => handlePrint(option.type)}
              >
                {option.label}
              </DropdownMenuItem>
            ))}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <div className="relative">
        {copyType !== "original" && (
          <div className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center print:flex">
            <span className="-rotate-[30deg] select-none text-8xl font-bold uppercase tracking-widest text-destructive/20">
              {copyType === "copia1" ? "Copia 1" : "Copia 2"}
            </span>
          </div>
        )}
        {children}
      </div>
    </>
  );
}
