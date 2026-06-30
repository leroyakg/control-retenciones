import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Eye, Pencil, Plus, Trash2 } from "lucide-react";
import Link from "next/link";
import { deleteCai } from "./actions";

type CaiRecord = {
  id: string;
  cai_id: string;
  distributor_id: string;
  bloque: string | null;
  merchant_id: string;
  company_id: string;
  start_from: string;
  end_from: string;
  emission_date: string;
  expiration_date: string;
  status: "activo" | "vencido" | "agotado" | "anulado";
  created_at: string;
  updated_at: string;
  deleted_at: string | null;
};

const statusVariant: Record<
  CaiRecord["status"],
  "default" | "secondary" | "destructive" | "outline"
> = {
  activo: "default",
  vencido: "destructive",
  agotado: "secondary",
  anulado: "outline",
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

export default async function CaiPage() {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cais")
    .select("*")
    .is("deleted_at", null)
    .order("created_at", { ascending: false });

  const cais = (data ?? []) as CaiRecord[];

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
                <th className="p-3 font-medium">Rango</th>
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
                  <td className="p-3 font-mono text-xs">{cai.cai_id}</td>
                  <td className="p-3 text-xs text-foreground/70">
                    {cai.start_from} – {cai.end_from}
                  </td>
                  <td className="p-3">{formatDate(cai.expiration_date)}</td>
                  <td className="p-3">
                    <Badge variant={statusVariant[cai.status] ?? "secondary"}>
                      {cai.status}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" title="Ver">
                        <Link href={`/dashboard/cai/${cai.id}`}>
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
    </div>
  );
}
