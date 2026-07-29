"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { ChevronDown, CircleCheckBig, Printer } from "lucide-react";
import { validarRetencion } from "@/app/dashboard/retenciones/actions";

type CopyType = "original" | "copia1" | "copia2";

const PRINT_OPTIONS: { type: CopyType; label: string }[] = [
  { type: "original", label: "Imprimir original y Cerrar" },
  { type: "copia1", label: "Imprimir copia 1" },
  { type: "copia2", label: "Imprimir copia 2" },
];

export function PrintControls({
  children,
  retencionId,
  procesado,
}: {
  children: ReactNode;
  retencionId: number;
  procesado: boolean;
}) {
  const [copyType, setCopyType] = useState<CopyType>("original");
  const [isProcesado, setIsProcesado] = useState(procesado);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  function handlePrint(type: CopyType) {
    setCopyType(type);
    // Espera a que el estado se aplique al DOM antes de abrir el diálogo de impresión.
    requestAnimationFrame(() => window.print());
  }

  function handleValidar() {
    setError(null);
    startTransition(async () => {
      try {
        await validarRetencion(retencionId);
        setIsProcesado(true);
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo validar el documento.",
        );
      }
    });
  }

  return (
    <>
      <div className="print:hidden mb-6 flex flex-col items-end gap-2">
        <div className="flex items-center justify-end">
          {isProcesado ? (
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
          ) : (
            <Button type="button" onClick={handleValidar} disabled={isPending}>
              <CircleCheckBig className="size-4" />
              {isPending ? "Validando…" : "Validar documento"}
            </Button>
          )}
        </div>
        {error && (
          <p className="text-sm text-destructive">{error}</p>
        )}
      </div>

      <div className="relative">
        {copyType !== "original" && (
          <div className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center print:flex">
            <span className="-rotate-[30deg] select-none text-8xl font-bold uppercase tracking-widest text-destructive/20">
              Copia
            </span>
          </div>
        )}
        {children}

        <div className="fixed bottom-0 left-0 right-0 z-50 hidden items-center justify-center gap-2 border-t border-foreground/10 bg-background/80 p-4 sm:flex">

          {copyType !== "original" ? (
            <p className="text-sm text-foreground/60">
              Copia: Obligado Tributario
            </p>
          ) : (
            <p className="text-sm text-foreground/60">
              Original: Cliente
            </p>
          )}
        </div>
      </div>
    </>
  );
}
