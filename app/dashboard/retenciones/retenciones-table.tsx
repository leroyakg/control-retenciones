import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ChevronLeft, ChevronRight, Pencil, Printer, Trash2 } from "lucide-react";
import { deleteRetencion } from "./actions";
import type { RetencionRecord } from "./types";

const PAGE_SIZE = 10;

const currency = new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL",
  minimumFractionDigits: 2,
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type RetencionRow = RetencionRecord & {
  retenciones_detalle: { importe_total: number }[];
};

export async function RetencionesTable({
  q,
  page,
}: {
  q: string;
  page: number;
}) {
  const supabase = await createClient();

  const from = (page - 1) * PAGE_SIZE;
  const to = from + PAGE_SIZE - 1;

  let query = supabase
    .from("retenciones")
    .select("*, retenciones_detalle(importe_total)", { count: "exact" })
    .order("create_time", { ascending: false })
    .range(from, to);

  if (q) {
    query = query.or(
      `proveedor.ilike.%${q}%,rtn.ilike.%${q}%,correlativo.ilike.%${q}%`,
    );
  }

  const { data, error, count } = await query;

  const retenciones = (data ?? []) as RetencionRow[];
  const totalPages = Math.max(1, Math.ceil((count ?? 0) / PAGE_SIZE));

  const pageHref = (p: number) => {
    const params = new URLSearchParams();
    if (q) params.set("q", q);
    if (p > 1) params.set("page", String(p));
    const qs = params.toString();
    return qs ? `/dashboard/retenciones?${qs}` : "/dashboard/retenciones";
  };

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        No se pudo cargar la lista de retenciones: {error.message}
      </p>
    );
  }

  if (retenciones.length === 0) {
    return (
      <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
        No se encontraron retenciones.
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="overflow-x-auto rounded-md border border-foreground/10">
        <table className="w-full text-sm">
          <thead className="border-b border-foreground/10 text-left text-foreground/60">
            <tr>
              <th className="p-3 font-medium">Proveedor</th>
              <th className="p-3 font-medium">RTN</th>
              <th className="p-3 font-medium">CAI</th>
              <th className="p-3 font-medium">Correlativo</th>
              <th className="p-3 font-medium">F. documento</th>
              <th className="p-3 font-medium">F. emisión</th>
              <th className="p-3 font-medium text-right">Total retenido</th>
              <th className="p-3 font-medium text-right">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {retenciones.map((r) => {
              const total = r.retenciones_detalle.reduce(
                (sum, d) => sum + (Number(d.importe_total) || 0),
                0,
              );

              return (
                <tr
                  key={r.id}
                  className="border-b border-foreground/5 last:border-0 hover:bg-accent/40"
                >
                  <td className="p-3 font-medium">{r.proveedor}</td>
                  <td className="p-3 font-mono text-xs text-foreground/70">
                    {r.rtn}
                  </td>
                  <td className="p-3 font-mono text-xs text-foreground/70">
                    {r.cai}
                  </td>
                  <td className="p-3 font-mono text-xs text-foreground/70">
                    {r.correlativo ?? "—"}
                  </td>
                  <td className="p-3 text-foreground/70">
                    {formatDate(r.fecha_documento)}
                  </td>
                  <td className="p-3 text-foreground/70">
                    {formatDate(r.fecha_emision)}
                  </td>
                  <td className="p-3 text-right tabular-nums">
                    {currency.format(total)}
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" title="Imprimir">
                        <Link
                          href={`/imprimir/retenciones/${r.id}`}
                          target="_blank"
                        >
                          <Printer className="size-4" />
                        </Link>
                      </Button>
                      <Button asChild size="icon" variant="ghost" title="Editar">
                        <Link href={`/dashboard/retenciones/${r.id}/editar`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      {/* <form action={deleteRetencion}>
                        <input type="hidden" name="id" value={r.id} />
                        <Button
                          size="icon"
                          variant="ghost"
                          type="submit"
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </form> */}
                    </div>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      <div className="flex items-center justify-between text-sm text-foreground/60">
        <span>
          Página {page} de {totalPages} · {count ?? 0} retenciones
        </span>
        <div className="flex gap-2">
          <Button asChild size="icon" variant="outline" disabled={page <= 1}>
            <Link
              href={pageHref(Math.max(1, page - 1))}
              aria-disabled={page <= 1}
              tabIndex={page <= 1 ? -1 : undefined}
              className={page <= 1 ? "pointer-events-none opacity-50" : ""}
            >
              <ChevronLeft className="size-4" />
            </Link>
          </Button>
          <Button
            asChild
            size="icon"
            variant="outline"
            disabled={page >= totalPages}
          >
            <Link
              href={pageHref(Math.min(totalPages, page + 1))}
              aria-disabled={page >= totalPages}
              tabIndex={page >= totalPages ? -1 : undefined}
              className={
                page >= totalPages ? "pointer-events-none opacity-50" : ""
              }
            >
              <ChevronRight className="size-4" />
            </Link>
          </Button>
        </div>
      </div>
    </div>
  );
}
