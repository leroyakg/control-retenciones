import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { RetencionesTable } from "./retenciones-table";

const RetencionesContent = async ({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) => {
  const { q = "", page: pageParam } = await searchParams;
  const page = Math.max(1, Number(pageParam) || 1);

  return (
    <>
      <form className="flex flex-wrap items-end gap-3">
        <div className="relative flex-1 min-w-50">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-foreground/40" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por proveedor, RTN o correlativo…"
            className="pl-9"
          />
        </div>
        <Button type="submit" variant="secondary">
          Buscar
        </Button>
        {q && (
          <Button asChild variant="ghost">
            <Link href="/dashboard/retenciones">Limpiar</Link>
          </Button>
        )}
      </form>

      <RetencionesTable q={q} page={page} />
    </>
  );
};

export default function RetencionesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string; page?: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold">Retenciones</h1>
          <p className="text-sm text-foreground/60">
            Retenciones registradas en el sistema.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard/retenciones/nuevo">
            <Plus className="size-4" />
            Nueva Retención
          </Link>
        </Button>
      </div>

      <Suspense
        fallback={
          <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
            Cargando retenciones…
          </div>
        }
      >
        <RetencionesContent searchParams={searchParams} />
      </Suspense>
    </div>
  );
}
