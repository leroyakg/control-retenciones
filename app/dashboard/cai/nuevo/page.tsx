import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createCai } from "../actions";
import { CaiForm } from "../cai-form";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";

const NuevoCaiForm = async () => {

  const supabase = await createClient();

  const [caisRes] = await Promise.all([
    supabase
      .from("cais")
      .select("*")
      .is("delete_time", null)
      .order("create_time", { ascending: false })
      .limit(1),
  ]);

  if (caisRes.error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        No se pudo cargar los CAIs: {caisRes.error.message}
      </p>
    );
  }

  const cais = caisRes.data ?? [];

  // If there are no CAIs, we can render the form for creating a new one
  if (cais.length === 0) {
    return (
      <CaiForm
        editMode={true}
        action={createCai}
        submitLabel="Guardar"
        previousCai={null}
      />
    );
  }

  const latestCai = cais[0];

  // if (latestCai.estatus === "activo") {
  //   return (
  //     <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
  //       El CAI más reciente aún está activo. Por favor, editá el CAI existente en lugar de crear uno nuevo.
  //     </div>
  //   );
  // }

  // const todayStr = new Intl.DateTimeFormat("en-CA", {
  //   timeZone: "America/Tegucigalpa",
  // }).format(new Date());

  if (latestCai.estatus == 'activo') {
    return (
      <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
        El CAI más reciente aún está activo. Por favor, revisa si aun hay correlativos disponibles antes de crear uno nuevo.
      </div>

    );
  }

  // if (latestCai.fecha_expiracion && latestCai.fecha_expiracion.slice(0, 10) > todayStr) {
  //   return (
  //     <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
  //       El CAI más reciente aún está activo. Por favor, editá el CAI existente en lugar de crear uno nuevo.
  //     </div>
  //   );
  // }

  // if (latestCai.correlativo_actual < latestCai.rango_final) {
  //   return (
  //     <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
  //       El CAI más reciente aún tiene correlativos disponibles. Por favor, editá el CAI existente en lugar de crear uno nuevo.
  //     </div>
  //   );
  // }

  return (
    <CaiForm
      editMode={true}
      action={createCai}
      submitLabel="Guardar"
      presetValues={latestCai}
      previousCai={latestCai?.cai}
    />
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

      <Suspense
        fallback={
          <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
            Cargando formulario…
          </div>
        }
      >
        <NuevoCaiForm />
      </Suspense>
    </div>
  );
}
