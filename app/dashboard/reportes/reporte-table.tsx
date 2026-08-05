import { createClient } from "@/lib/supabase/server";
import type { RetencionRecord } from "../retenciones/types";

const MAX_ROWS = 1000;

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

export type ReporteFilters = {
  desde: string;
  hasta: string;
  comprobante: string;
  proveedor: string;
  baseMin: string;
  baseMax: string;
  retMin: string;
  retMax: string;
  anuladas: boolean;
};

type ReporteRow = RetencionRecord & {
  retenciones_detalle: { base_imponible: number; importe_total: number }[];
};

function parseAmount(value: string): number | null {
  if (!value.trim()) return null;
  const n = Number(value);
  return Number.isNaN(n) ? null : n;
}

export async function ReporteTable({ filters }: { filters: ReporteFilters }) {
  const supabase = await createClient();

  let query = supabase
    .from("retenciones")
    .select(
      "id, proveedor, rtn, correlativo, fecha_emision, fecha_anulacion, retenciones_detalle(base_imponible, importe_total)",
    )
    .order("fecha_emision", { ascending: false })
    .order("correlativo", { ascending: false })
    .limit(MAX_ROWS);

  if (filters.desde) query = query.gte("fecha_emision", filters.desde);
  if (filters.hasta) query = query.lte("fecha_emision", filters.hasta);
  if (filters.comprobante)
    query = query.ilike("correlativo", `%${filters.comprobante}%`);
  if (filters.proveedor)
    query = query.ilike("proveedor", `%${filters.proveedor}%`);
  if (!filters.anuladas) query = query.is("fecha_anulacion", null);

  const { data, error } = await query;

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        No se pudo generar el reporte: {error.message}
      </p>
    );
  }

  const baseMin = parseAmount(filters.baseMin);
  const baseMax = parseAmount(filters.baseMax);
  const retMin = parseAmount(filters.retMin);
  const retMax = parseAmount(filters.retMax);

  // The amounts live in the detail rows, so aggregate per retención and
  // apply the amount filters over the aggregated values.
  const rows = ((data ?? []) as unknown as ReporteRow[])
    .map((r) => {
      const base = r.retenciones_detalle.reduce(
        (sum, d) => sum + (Number(d.base_imponible) || 0),
        0,
      );
      const retenido = r.retenciones_detalle.reduce(
        (sum, d) => sum + (Number(d.importe_total) || 0),
        0,
      );
      return { ...r, base, retenido };
    })
    .filter((r) => {
      if (baseMin !== null && r.base < baseMin) return false;
      if (baseMax !== null && r.base > baseMax) return false;
      if (retMin !== null && r.retenido < retMin) return false;
      if (retMax !== null && r.retenido > retMax) return false;
      return true;
    });

  if (rows.length === 0) {
    return (
      <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
        No se encontraron retenciones con los filtros seleccionados.
      </div>
    );
  }

  const totalBase = rows.reduce((sum, r) => sum + r.base, 0);
  const totalRetenido = rows.reduce((sum, r) => sum + r.retenido, 0);

  return (
    <div className="flex flex-col gap-4">
      {(data?.length ?? 0) >= MAX_ROWS && (
        <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400">
          El reporte se limitó a {MAX_ROWS} retenciones. Ajustá los filtros
          para acotar el resultado.
        </p>
      )}

      <div className="overflow-x-auto rounded-md border border-foreground/10">
        <table className="w-full text-sm">
          <thead className="border-b border-foreground/10 text-left text-foreground/60">
            <tr>
              <th className="p-3 font-medium">F. emisión</th>
              <th className="p-3 font-medium">Comprobante</th>
              <th className="p-3 font-medium">Proveedor</th>
              <th className="p-3 font-medium">RTN</th>
              <th className="p-3 font-medium text-right">Base imponible</th>
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
                <td className="p-3 font-mono text-xs text-foreground/70">
                  {r.correlativo ?? "—"}
                  {r.fecha_anulacion && (
                    <span className="ml-2 rounded bg-destructive/10 px-1.5 py-0.5 text-[10px] font-sans font-medium text-destructive">
                      Anulada
                    </span>
                  )}
                </td>
                <td className="p-3 font-medium">{r.proveedor}</td>
                <td className="p-3 font-mono text-xs text-foreground/70">
                  {r.rtn}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {currency.format(r.base)}
                </td>
                <td className="p-3 text-right tabular-nums">
                  {currency.format(r.retenido)}
                </td>
              </tr>
            ))}
          </tbody>
          <tfoot className="border-t border-foreground/10 bg-accent/30 font-medium">
            <tr>
              <td className="p-3" colSpan={4}>
                Total · {rows.length}{" "}
                {rows.length === 1 ? "retención" : "retenciones"}
              </td>
              <td className="p-3 text-right tabular-nums">
                {currency.format(totalBase)}
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
