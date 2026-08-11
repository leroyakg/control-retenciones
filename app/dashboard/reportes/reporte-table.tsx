import Link from "next/link";
import { Button } from "@/components/ui/button";
import { FileDown, FileSpreadsheet } from "lucide-react";
import {
  fetchReporte,
  filtersToQueryString,
  formatPct,
  MAX_ROWS,
  type ReporteFilters,
} from "./data";

const currency = new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL",
  minimumFractionDigits: 2,
});

function formatDate(value: string | null) {
  if (!value) return "—";
  // Date-only string ("YYYY-MM-DD"); format the parts directly so it isn't
  // shifted back a day by parsing as UTC midnight in Honduras time (UTC-6).
  const [year, month, day] = value.slice(0, 10).split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return value;
}

export type { ReporteFilters };

export async function ReporteTable({ filters }: { filters: ReporteFilters }) {
  const { error, rows, totalBase, totalRetenido, truncated } =
    await fetchReporte(filters);

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        No se pudo generar el reporte: {error}
      </p>
    );
  }

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
        No se encontraron retenciones con los filtros seleccionados.
      </div>
    );
  }

  const qs = filtersToQueryString(filters);
  const exportHref = qs ? `/imprimir/reportes?${qs}` : "/imprimir/reportes";
  const exportExcelHref = qs
    ? `/api/reportes/export?${qs}`
    : "/api/reportes/export";

  return (
    <div className="flex flex-col gap-4">
      {truncated && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          El reporte se limitó a {MAX_ROWS} retenciones. Ajustá los filtros
          para acotar el resultado.
        </p>
      )}

      <div className="flex justify-end gap-2">
        <Button asChild variant="outline">
          <a href={exportExcelHref} download>
            <FileSpreadsheet className="size-4" />
            Exportar Excel
          </a>
        </Button>
        <Button asChild variant="outline">
          <Link href={exportHref} prefetch={false}>
            <FileDown className="size-4" />
            Exportar PDF
          </Link>
        </Button>
      </div>

      <div className="overflow-x-auto rounded-md border border-foreground/10">
        <table className="w-full text-sm">
          <thead className="border-b border-foreground/10 text-left text-foreground/60">
            <tr>
              <th className="p-3 font-medium">F. emisión</th>
              <th className="p-3 font-medium">Comprobante</th>
              <th className="p-3 font-medium">Proveedor</th>
              <th className="p-3 font-medium text-right">Base imponible</th>
              <th className="p-3 font-medium text-right">% Retenido</th>
              <th className="p-3 font-medium text-right">Valor retenido</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr
                key={r.id}
                className="border-b border-foreground/5 last:border-0 hover:bg-accent/40"
              >
                <td className="p-3 text-foreground/70">
                  {formatDate(r.fecha_emision)}
                </td>
                <td className="p-3 text-foreground/70">
                  {/* get the last 8 digits of the correlativo */}
                  {r.correlativo ? r.correlativo.slice(-8) : "—"}
                  {r.fecha_anulacion && (
                    <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-sans text-destructive">
                      Anulada
                    </span>
                  )}
                </td>
                <td className="p-3 text-foreground/70">{r.proveedor}</td>
                <td className="p-3 text-right text-foreground/70">
                  {/* if is anulado, add a stripe to the value */}
                  {r.fecha_anulacion ?
                    " - " :// <span className="text-foreground/70 text-strikethrough">( {currency.format(r.base)} )</span> :
                    currency.format(r.base)
                  }
                </td>
                <td className="p-3 text-right text-foreground/70">
                  {r.fecha_anulacion ?
                    " - " : // <span className="text-foreground/70 text-strikethrough">( {formatPct(r.base, r.retenido)} )</span> : 
                    formatPct(r.base, r.retenido)}
                </td>
                <td className="p-3 text-right text-foreground/70">
                  {r.fecha_anulacion ?
                    " - " : // <span className="text-foreground/70 text-strikethrough">( {currency.format(r.retenido)} )</span> : 
                    currency.format(r.retenido)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-foreground/10 bg-accent/30">
            <tr>
              <td className="p-3" colSpan={3}>
                Total · {rows.length}{" "}
                {rows.length === 1 ? "retención" : "retenciones"}
              </td>
              <td className="p-3 text-right tabular-nums">
                {currency.format(totalBase)}
              </td>
              <td className="p-3 text-right tabular-nums">
                {formatPct(totalBase, totalRetenido)}
              </td>
              <td className="p-3 text-right tabular-nums">
                {currency.format(totalRetenido)}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>
    </div>
  );
}
