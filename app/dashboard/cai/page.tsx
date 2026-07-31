import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteCai } from "./actions";
import { Suspense } from "react";
import type { CaiEstatus, CaiRecord } from "./types";

const statusVariant: Record<
  CaiEstatus,
  "default" | "secondary" | "destructive" | "outline"
> = {
  activo: "default",
  vencido: "destructive",
  agotado: "secondary",
  anulado: "outline",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  // `value` is a date-only string ("YYYY-MM-DD"). `new Date(value)` would parse
  // it as UTC midnight and then shift it back a day in Honduras time (UTC-6),
  // so format the parts directly instead of going through a timezone.
  const [year, month, day] = value.slice(0, 10).split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return value;
}

function formatRange(cai: CaiRecord) {
  const inicio = cai.rango_inicial?.toLocaleString("es-HN") ?? "—";
  const final = cai.rango_final?.toLocaleString("es-HN") ?? "—";
  return `${inicio} – ${final}`;
}

const CaiTable = async () => {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cais")
    .select("*")
    .is("delete_time", null)
    .order("create_time", { ascending: false });

  const cais = (data ?? []) as CaiRecord[];

  return (
    <>
      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          No se pudo cargar la lista de CAIs: {error.message}
        </p>
      ) : cais.length === 0 ? (
        <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
          Aún no hay CAIs registrados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-foreground/10">
          <table className="w-full text-sm">
            <thead className="border-b border-foreground/10 text-left text-foreground/60">
              <tr>
                <th className="p-3 font-medium">Bloque</th>
                <th className="p-3 font-medium">CAI</th>
                <th className="p-3 font-medium">Prefijo</th>
                <th className="p-3 font-medium">Rango</th>
                <th className="p-3 font-medium">Emisión</th>
                <th className="p-3 font-medium">Vencimiento</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {cais.map((cai) => (
                <tr
                  key={cai.id}
                  className="border-b border-foreground/5 last:border-0 hover:bg-accent/40"
                >
                  <td className="p-3 font-medium">{cai.bloque ?? "—"}</td>
                  <td className="p-3 font-mono text-xs">{cai.cai}</td>
                  <td className="p-3 font-mono text-xs text-foreground/70">
                    {cai.prefijo ?? "—"}
                  </td>
                  <td className="p-3 text-xs text-foreground/70">
                    {formatRange(cai)}
                  </td>
                  <td className="p-3">{formatDate(cai.fecha_emision)}</td>
                  <td className="p-3">{formatDate(cai.fecha_expiracion)}</td>
                  <td className="p-3">
                    <Badge variant={statusVariant[cai.estatus] ?? "secondary"}>
                      {cai.estatus}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" title="Ver">
                        <Link href={`/dashboard/cai/${cai.id}/ver`}>
                          <Eye className="size-4" />
                        </Link>
                      </Button>
                      <Button asChild size="icon" variant="ghost" title="Editar">
                        <Link href={`/dashboard/cai/${cai.id}/editar`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <form action={deleteCai}>
                        <input type="hidden" name="id" value={cai.id} />
                        <Button
                          size="icon"
                          variant="ghost"
                          type="submit"
                          title="Eliminar"
                          className="text-destructive hover:text-destructive"
                        >
                          <Trash2 className="size-4" />
                        </Button>
                      </form>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
};

export default function CaiPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">CAI</h1>
          <p className="text-sm text-foreground/60">
            Códigos de autorización de impresión registrados.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/cai/nuevo">
            <Plus className="size-4" />
            Nuevo CAI
          </Link>
        </Button>
      </div>

      <Suspense fallback={
        <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
          Cargando CAIs…
        </div>
      }>
        <CaiTable />
      </Suspense>
    </div>
  );
}
