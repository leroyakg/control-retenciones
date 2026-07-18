import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { updateCai } from "../../actions";
import { CaiForm } from "../../cai-form";
import type { CaiRecord } from "../../types";

const EditarCaiForm = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const supabase = await createClient();
  const { data, error } = await supabase
    .from("cais")
    .select("*")
    .eq("id", id)
    .is("delete_time", null)
    .maybeSingle();

  if (error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        No se pudo cargar el CAI: {error.message}
      </p>
    );
  }

  if (!data) {
    notFound();
  }

  const cai = data as CaiRecord;
  const action = updateCai.bind(null, cai.id);

  return <CaiForm action={action} cai={cai} submitLabel="Actualizar" />;
};

export default function EditarCaiPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center gap-3">
        <Button asChild size="icon" variant="ghost">
          <Link href="/dashboard/cai" title="Volver">
            <ArrowLeft className="size-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Editar CAI</h1>
          <p className="text-sm text-foreground/60">
            Actualizá los datos del bloque de autorización de impresión.
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
        <EditarCaiForm params={params} />
      </Suspense>
    </div>
  );
}
