import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { createRetencion } from "../actions";
import { RetencionForm } from "../retencion-form";

const NuevaRetencionForm = async () => {
  const supabase = await createClient();

  const { data } = await supabase
    .from("cais")
    .select("id, cai, bloque, prefijo, correlativo_actual")
    .eq("estatus", "activo")
    .is("delete_time", null)
    .order("create_time", { ascending: false });

  return <RetencionForm action={createRetencion} cais={data ?? []} />;
};

export default function NuevaRetencionPage() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild size="icon" variant="ghost">
          <Link href="/dashboard/retenciones" title="Volver">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Nueva Retención</h1>
          <p className="text-sm text-foreground/60">
            Registrá una retención y su detalle.
          </p>
        </div>
      </div>

      <Suspense
        fallback={
          <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
            Cargando formulario…
          </div>
        }
      >
        <NuevaRetencionForm />
      </Suspense>
    </div>
  );
}
