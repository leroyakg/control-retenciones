import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Pencil, Plus, Search } from "lucide-react";
import Link from "next/link";
import { DeleteDistributorButton } from "./delete-distributor-button";
import { Suspense } from "react";

type Distributor = {
  id: string;
  nickname: string;
  city: string | null;
  state: string | null;
  phone_number: string | null;
  country: string | null;
  status: string | null;
};

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring";

const ProveedoresContent = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) => {
  const { q = "", status = "" } = await searchParams;

  const supabase = await createClient();
  let query = supabase
    .from("distributor")
    .select("id, nickname, city, state, phone_number, country, status")
    .or("soft_delete.is.null,soft_delete.eq.0")
    .order("nickname");

  if (q) query = query.ilike("nickname", `%${q}%`);
  if (status) query = query.eq("status", status);

  const { data, error } = await query;
  const distributors = (data ?? []) as Distributor[];

  return (
    <>
      <form className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nombre…"
            className="pl-9"
          />
        </div>
        <select name="status" defaultValue={status} className={`${selectClass} w-40`}>
          <option value="">Todos los estados</option>
          <option value="activo">activo</option>
          <option value="inactivo">inactivo</option>
        </select>
        <Button type="submit" variant="secondary">
          Filtrar
        </Button>
        {(q || status) && (
          <Button asChild variant="ghost">
            <Link href="/dashboard/proveedores">Limpiar</Link>
          </Button>
        )}
      </form>

      {error ? (
        <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
          No se pudo cargar la lista: {error.message}
        </p>
      ) : distributors.length === 0 ? (
        <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
          No se encontraron proveedores.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-md border border-foreground/10">
          <table className="w-full text-sm">
            <thead className="border-b border-foreground/10 text-left text-foreground/60">
              <tr>
                <th className="p-3 font-medium">Nombre</th>
                <th className="p-3 font-medium">Ciudad</th>
                <th className="p-3 font-medium">Teléfono</th>
                <th className="p-3 font-medium">Estado</th>
                <th className="p-3 font-medium text-right">Acciones</th>
              </tr>
            </thead>
            <tbody>
              {distributors.map((d) => (
                <tr
                  key={d.id}
                  className="border-b border-foreground/5 last:border-0 hover:bg-accent/40"
                >
                  <td className="p-3 font-medium">{d.nickname}</td>
                  <td className="p-3 text-foreground/70">
                    {[d.city, d.state].filter(Boolean).join(", ") || "—"}
                  </td>
                  <td className="p-3 text-foreground/70">
                    {d.phone_number ?? "—"}
                  </td>
                  <td className="p-3">
                    <Badge variant={d.status === "activo" ? "default" : "secondary"}>
                      {d.status ?? "—"}
                    </Badge>
                  </td>
                  <td className="p-3">
                    <div className="flex items-center justify-end gap-1">
                      <Button asChild size="icon" variant="ghost" title="Editar">
                        <Link href={`/dashboard/proveedores/${d.id}/editar`}>
                          <Pencil className="size-4" />
                        </Link>
                      </Button>
                      <DeleteDistributorButton id={d.id} nickname={d.nickname} />
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  )
};

export default function ProveedoresPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; status?: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Proveedores</h1>
          <p className="text-sm text-foreground/60">
            Distribuidores e imprentas registrados.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/proveedores/nuevo">
            <Plus className="size-4" />
            Nuevo proveedor
          </Link>
        </Button>
      </div>

      <Suspense fallback={
        <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
          Cargando proveedores…
        </div>
      }>
        <ProveedoresContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
