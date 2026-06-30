import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { createCai } from "../actions";

const STATUSES = ["activo", "vencido", "agotado", "anulado"] as const;

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

const NuevoCaiForm = async () => {
  const supabase = await createClient();

  const [companies, merchants, distributors] = await Promise.all([
    supabase.from("company").select("id, name").order("name"),
    supabase.from("merchant").select("id, nickname").order("nickname"),
    supabase.from("distributor").select("id, nickname").order("nickname"),
  ]);

  return (
    <form action={createCai} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cai_id">CAI</Label>
          <Input
            id="cai_id"
            name="cai_id"
            placeholder="7F92-AB34-XX11"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bloque">Nombre del bloque</Label>
          <Input
            id="bloque"
            name="bloque"
            placeholder="Retenciones 2026"
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="start_from">Rango desde</Label>
          <Input
            id="start_from"
            name="start_from"
            placeholder="000-001-01-00000001"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="end_from">Rango hasta</Label>
          <Input
            id="end_from"
            name="end_from"
            placeholder="000-001-01-00000500"
            required
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="emission_date">Fecha de emisión</Label>
          <Input
            id="emission_date"
            name="emission_date"
            type="date"
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="expiration_date">Fecha de vencimiento</Label>
          <Input
            id="expiration_date"
            name="expiration_date"
            type="date"
            required
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="company_id">Empresa</Label>
          <select id="company_id" name="company_id" required className={selectClass} defaultValue="">
            <option value="" disabled>
              Seleccionar empresa
            </option>
            {(companies.data ?? []).map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="merchant_id">Negocio</Label>
          <select id="merchant_id" name="merchant_id" required className={selectClass} defaultValue="">
            <option value="" disabled>
              Seleccionar negocio
            </option>
            {(merchants.data ?? []).map((m) => (
              <option key={m.id} value={m.id}>
                {m.nickname}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="distributor_id">Imprenta</Label>
          <select id="distributor_id" name="distributor_id" required className={selectClass} defaultValue="">
            <option value="" disabled>
              Seleccionar distribuidor
            </option>
            {(distributors.data ?? []).map((d) => (
              <option key={d.id} value={d.id}>
                {d.nickname}
              </option>
            ))}
          </select>
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="status">Estado</Label>
          <select id="status" name="status" className={selectClass} defaultValue="activo">
            {STATUSES.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit">Guardar</Button>
        <Button asChild variant="outline" type="button">
          <Link href="/dashboard/cai">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
};

export default function NuevoCaiPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild size="icon" variant="ghost">
          <Link href="/dashboard/cai" title="Volver">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Nuevo CAI</h1>
          <p className="text-sm text-foreground/60">
            Registrá un nuevo bloque de autorización de impresión.
          </p>
        </div>
      </div>

      <Suspense fallback={
        <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
          Cargando formulario…
        </div>
      }>
        <NuevoCaiForm />
      </Suspense>
    </div>
  );
}
