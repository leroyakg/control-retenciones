import { redirect } from "next/navigation";
import Image from "next/image";
import { createClient } from "@/lib/supabase/server";
import {
  fetchReporte,
  filtersToQueryString,
  formatPct,
  parseFilters,
  MAX_ROWS,
  type ReporteSearchParamsValues,
} from "@/app/dashboard/reportes/data";
import { PrintToolbar } from "./print-toolbar";
import logo from "@/img/logo_lcp_og_crop_no_bckgrd.png";

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

export default async function ImprimirReportePage({
  searchParams,
}: {
  searchParams: Promise<ReporteSearchParamsValues>;
}) {
  const supabase = await createClient();

  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims) {
    redirect("/auth/login");
  }

  const params = await searchParams;
  const filters = parseFilters(params);

  const { error, rows, totalBase, totalRetenido, truncated } =
    await fetchReporte(filters);

  if (error) {
    return (
      <p className="m-6 rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        No se pudo generar el reporte: {error}
      </p>
    );
  }

  const qs = filtersToQueryString(filters);
  const backHref = qs ? `/dashboard/reportes?${qs}` : "/dashboard/reportes";

  const filtroFechas =
    filters.desde || filters.hasta
      ? `Del ${filters.desde ? formatDate(filters.desde) : "inicio"} al ${filters.hasta ? formatDate(filters.hasta) : "presente"
      }`
      : "Todas las fechas";

  const otrosFiltros = [
    filters.comprobante && `Comprobante: ${filters.comprobante}`,
    filters.proveedor && `Proveedor: ${filters.proveedor}`,
    filters.tipo && `Tipo: ${filters.tipo}`,
    (filters.baseMin || filters.baseMax) &&
    `Base imponible: ${filters.baseMin || "0"} – ${filters.baseMax || "∞"}`,
    (filters.retMin || filters.retMax) &&
    `Valor retenido: ${filters.retMin || "0"} – ${filters.retMax || "∞"}`,
    filters.anuladas && "Incluye anuladas",
  ].filter(Boolean);

  return (
    <div className="mx-auto max-w-4xl p-6 print:p-0">
      <PrintToolbar backHref={backHref} />

      <div className="flex flex-col gap-6">
        <header className="flex flex-col items-center gap-2 border-b border-foreground/10 pb-4 text-center">
          <Image
            src={logo}
            alt="La Casa del Panadero"
            width={198}
            height={96}
            className="mb-1"
          />
          <h1 className="text-xl font-bold underline underline-offset-2">
            La Casa del Panadero S. de R.L.
          </h1>
          <p className="text-xs leading-snug text-foreground/70">
            R.T.N. 08019009225129
          </p>

          <h2 className="mt-2 text-base font-semibold">
            Reporte de Retenciones
          </h2>
          <p className="text-xs leading-snug text-foreground/70">
            {filtroFechas}
            {otrosFiltros.length > 0 && (
              <>
                <br />
                {otrosFiltros.join(" · ")}
              </>
            )}
          </p>
        </header>

        {truncated && (
          <p className="rounded-md border border-amber-500/30 bg-amber-500/10 p-3 text-sm text-amber-600 dark:text-amber-400 print:text-amber-700">
            El reporte se limitó a {MAX_ROWS} retenciones. Ajustá los filtros
            para acotar el resultado.
          </p>
        )}

        {rows.length === 0 ? (
          <p className="p-10 text-center text-sm text-foreground/60">
            No se encontraron retenciones con los filtros seleccionados.
          </p>
        ) : (
          <table className="w-full text-sm">
            <thead className="border-b border-foreground/20 text-left text-foreground/60">
              <tr>
                <th className="p-2 font-medium">F. emisión</th>
                <th className="p-2 font-medium">Comprobante</th>
                <th className="p-2 font-medium">Proveedor</th>
                <th className="p-2 font-medium text-right">Base imponible</th>
                <th className="p-2 font-medium text-right">% Ret.</th>
                <th className="p-2 font-medium text-right">Valor retenido</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-foreground/5 last:border-0"
                >
                  <td className="p-2 text-xs text-foreground/70">
                    {formatDate(r.fecha_emision)}
                  </td>
                  <td className="p-2 text-xs text-foreground/70">
                    {/* Mostrar solo los ultimos 8 digitos del correlativo */}
                    {r.correlativo ? r.correlativo.slice(-8) : "—"}
                    {r.fecha_anulacion && (
                      <span className="ml-2 font-sans font-medium text-destructive">
                        (Anulada)
                      </span>
                    )}
                  </td>
                  <td className="p-2 text-xs text-foreground/70">{r.proveedor}</td>
                  <td className="p-2 text-xs text-right text-foreground/70">
                    {currency.format(r.base)}
                  </td>
                  <td className="p-2 text-xs text-right text-foreground/70">
                    {formatPct(r.base, r.retenido)}
                  </td>
                  <td className="p-2 text-xs text-right text-foreground/70">
                    {currency.format(r.retenido)}
                  </td>
                </tr>
              ))}
            </tbody>
            <tfoot className="border-t-2 border-foreground/20 font-semibold">
              <tr>
                <td className="p-2" colSpan={3}>
                  Total · {rows.length}{" "}
                  {rows.length === 1 ? "retención" : "retenciones"}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {currency.format(totalBase)}
                </td>
                <td className="p-2 text-right tabular-nums text-xs">
                  {formatPct(totalBase, totalRetenido)}
                </td>
                <td className="p-2 text-right tabular-nums">
                  {currency.format(totalRetenido)}
                </td>
              </tr>
            </tfoot>
          </table>
        )}
      </div>
    </div>
  );
}
