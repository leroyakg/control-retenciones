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
    .select("id, cai, bloque, prefijo, correlativo_actual, rango_inicial, rango_final, fecha_expiracion")
    .eq("estatus", "activo")
    .is("delete_time", null)
    .order("create_time", { ascending: false });

  if (!data || data.length === 0) {
    return (
      <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
        No hay CAIs activos disponibles. Por favor, registrá un CAI antes de crear una retención.
      </div>
    );
  }

  const { correlativo_actual, rango_final, fecha_expiracion } = data[0];

  console.log({
    correlativo_actual,
    rango_final,
    fecha_expiracion
  })

  if (correlativo_actual > rango_final) {
    return (
      <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
        El CAI activo ha alcanzado su límite de correlativos. Por favor, registrá un nuevo CAI antes de crear una retención.
      </div>
    );
  }


  // `fecha_expiracion` is a date-only string ("YYYY-MM-DD"). Comparing it via
  // `new Date()` treats it as UTC midnight and, in Honduras time (UTC-6), marks
  // it expired a day early. Compare calendar dates as strings instead, treating
  // the CAI as valid through its expiration day (inclusive).
  const todayStr = new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/Tegucigalpa",
  }).format(new Date());

  if (fecha_expiracion && fecha_expiracion.slice(0, 10) < todayStr) {
    return (
      <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
        El CAI activo ha expirado. Por favor, registrá un nuevo CAI antes de crear una retención.
      </div>
    );
  }

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
