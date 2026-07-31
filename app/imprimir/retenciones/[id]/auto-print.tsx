"use client";

import { useState, useTransition, type ReactNode } from "react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Ban, ChevronDown, CircleCheckBig, Printer } from "lucide-react";
import {
  anularRetencion,
  validarRetencion,
} from "@/app/dashboard/retenciones/actions";

type CopyType = "original" | "copia" | "anulado";

const PRINT_OPTIONS: { type: CopyType; label: string }[] = [
  { type: "original", label: "Imprimir original" },
  { type: "copia", label: "Imprimir copia" },
];

const ANULADO_OPTIONS: { type: CopyType; label: string }[] = [
  { type: "anulado", label: "Imprimir anulado" },
];

const WATERMARK: Record<CopyType, string> = {
  original: "Original",
  copia: "Copia",
  anulado: "Anulado",
};

export function PrintControls({
  children,
  retencionId,
  procesado,
  anulado,
}: {
  children: ReactNode;
  retencionId: number;
  procesado: boolean;
  anulado: boolean;
}) {
  const [isAnulado, setIsAnulado] = useState(anulado);
  const [copyType, setCopyType] = useState<CopyType>(
    anulado ? "anulado" : "original",
  );
  const [isProcesado, setIsProcesado] = useState(procesado);
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const printOptions = isAnulado ? ANULADO_OPTIONS : PRINT_OPTIONS;

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

  function handleAnular() {
    if (
      !window.confirm(
        "¿Anular este documento? Esta acción no se puede deshacer y solo podrá imprimirse como anulado.",
      )
    ) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await anularRetencion(retencionId);
        setIsAnulado(true);
        setCopyType("anulado");
      } catch (err) {
        setError(
          err instanceof Error ? err.message : "No se pudo anular el documento.",
        );
      }
    });
  }

  return (
    <>
      <div className="print:hidden mb-6 flex flex-col items-end gap-2">
        <div className="flex w-full items-center justify-end gap-2">
          {isProcesado || isAnulado ? (
            <>
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button type="button">
                    <Printer className="size-4 mr-auto" />
                    Imprimir
                    <ChevronDown className="size-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  {printOptions.map((option) => (
                    <DropdownMenuItem
                      key={option.type}
                      onClick={() => handlePrint(option.type)}
                    >
                      {option.label}
                    </DropdownMenuItem>
                  ))}
                </DropdownMenuContent>
              </DropdownMenu>

              {!isAnulado && (
                <Button
                  type="button"
                  variant="destructive"
                  onClick={handleAnular}
                  disabled={isPending}
                >
                  <Ban className="size-4" />
                  {isPending ? "Anulando…" : "Anular documento"}
                </Button>
              )}
            </>
          ) : (
            <Button type="button" onClick={handleValidar} disabled={isPending}>
              <CircleCheckBig className="size-4" />
              {isPending ? "Validando…" : "Validar documento"}
            </Button>
          )}
        </div>
        {isAnulado && (
          <p className="text-sm font-medium text-destructive">
            Documento anulado.
          </p>
        )}
        {error && <p className="text-sm text-destructive">{error}</p>}
      </div>

      <div className="relative">
        <div className="pointer-events-none fixed inset-0 z-50 hidden items-center justify-center print:flex">
          <span className="-rotate-[30deg] select-none text-8xl font-bold uppercase tracking-widest text-destructive/20">
            {WATERMARK[copyType]}
          </span>
        </div>

        {children}

        <div className="fixed bottom-0 left-0 right-0 z-50 hidden items-center justify-center gap-2 border-t border-foreground/10 bg-background/80 p-4 sm:flex">
          <p className="text-sm text-foreground/60">
            <span>Original: Cliente</span>
            <br />
            <span>Copia: Obligado Tributario Emisor</span>
          </p>
          <br />
        </div>
      </div>
    </>
  );
}
