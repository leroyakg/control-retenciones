import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Search } from "lucide-react";
import { ReporteTable } from "./reporte-table";
import {
  parseFilters,
  TIPOS_RETENCION,
  type ReporteSearchParamsValues,
} from "./data";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

type ReporteSearchParams = Promise<ReporteSearchParamsValues>;

const ReportesContent = async ({
  searchParams,
}: {
  searchParams: ReporteSearchParams;
}) => {
  const params = await searchParams;
  const filters = parseFilters(params);

  const hasFilters = Object.values(params).some((v) => v);

  return (
    <>
      <form className="flex flex-col gap-4 rounded-md border border-foreground/10 p-4">
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="desde">Emisión desde</Label>
            <Input
              id="desde"
              name="desde"
              type="date"
              defaultValue={filters.desde}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="hasta">Emisión hasta</Label>
            <Input
              id="hasta"
              name="hasta"
              type="date"
              defaultValue={filters.hasta}
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="comprobante">No. de comprobante</Label>
            <Input
              id="comprobante"
              name="comprobante"
              defaultValue={filters.comprobante}
              placeholder="000-001-01-…"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="proveedor">Proveedor</Label>
            <Input
              id="proveedor"
              name="proveedor"
              defaultValue={filters.proveedor}
              placeholder="Nombre del proveedor"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="tipo">Tipo de retención</Label>
            <select
              id="tipo"
              name="tipo"
              defaultValue={filters.tipo}
              className={selectClass}
            >
              <option value="">Todos</option>
              {TIPOS_RETENCION.map((tipo) => (
                <option key={tipo} value={tipo}>
                  {tipo}
                </option>
              ))}
            </select>
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="base_min">Base imponible mín.</Label>
            <Input
              id="base_min"
              name="base_min"
              type="number"
              step="0.01"
              min="0"
              defaultValue={filters.baseMin}
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="base_max">Base imponible máx.</Label>
            <Input
              id="base_max"
              name="base_max"
              type="number"
              step="0.01"
              min="0"
              defaultValue={filters.baseMax}
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ret_min">Valor retenido mín.</Label>
            <Input
              id="ret_min"
              name="ret_min"
              type="number"
              step="0.01"
              min="0"
              defaultValue={filters.retMin}
              placeholder="0.00"
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <Label htmlFor="ret_max">Valor retenido máx.</Label>
            <Input
              id="ret_max"
              name="ret_max"
              type="number"
              step="0.01"
              min="0"
              defaultValue={filters.retMax}
              placeholder="0.00"
            />
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <label className="flex items-center gap-2 text-sm text-foreground/70">
            <input
              type="checkbox"
              name="anuladas"
              defaultChecked={filters.anuladas}
              className="size-4 accent-primary"
            />
            Incluir anuladas
          </label>

          <div className="ml-auto flex gap-2">
            {hasFilters && (
              <Button asChild variant="ghost">
                <Link href="/dashboard/reportes">Limpiar</Link>
              </Button>
            )}
            <Button type="submit">
              <Search className="size-4" />
              Generar reporte
            </Button>
          </div>
        </div>
      </form>

      <ReporteTable filters={filters} />
    </>
  );
};

export default function ReportesPage({
  searchParams,
}: {
  searchParams: ReporteSearchParams;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-foreground/60">
          Reporte de retenciones con totales de base imponible y valor
          retenido.
        </p>
      </div>

      <Suspense
        fallback={
          <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
            Cargando reporte…
          </div>
        }
      >
        <ReportesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
