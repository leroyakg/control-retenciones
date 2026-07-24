import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { updateRetencion } from "../../actions";
import { RetencionForm } from "../../retencion-form";
import type { RetencionDetalleRecord, RetencionRecord } from "../../types";

const EditarRetencionForm = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const supabase = await createClient();

  const [retencionRes, detalleRes, caisRes] = await Promise.all([
    supabase.from("retenciones").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("retenciones_detalle")
      .select("*")
      .eq("retencion_id", id)
      .order("id", { ascending: true }),
    // Fetch every CAI (not just active) so the retención's own CAI always
    // resolves to a valid option, even if it has since expired.
    supabase
      .from("cais")
      .select("id, cai, bloque, prefijo, correlativo_actual")
      .is("delete_time", null)
      .order("create_time", { ascending: false }),
  ]);

  if (retencionRes.error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        No se pudo cargar la retención: {retencionRes.error.message}
      </p>
    );
  }

  if (!retencionRes.data) {
    notFound();
  }

  const retencion = retencionRes.data as RetencionRecord;
  const detalles = (detalleRes.data ?? []) as RetencionDetalleRecord[];
  const cais = caisRes.data ?? [];

  const action = updateRetencion.bind(null, retencion.id);

  return (
    <RetencionForm
      action={action}
      cais={cais}
      retencion={retencion}
      detalles={detalles}
      submitLabel="Actualizar"
    />
  );
};

export default function EditarRetencionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild size="icon" variant="ghost">
          <Link href="/dashboard/retenciones" title="Volver">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Editar Retención</h1>
          <p className="text-sm text-foreground/60">
            Actualizá los datos de la retención y su detalle.
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
        <EditarRetencionForm params={params} />
      </Suspense>
    </div>
  );
}
