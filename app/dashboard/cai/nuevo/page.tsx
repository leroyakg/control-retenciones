import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import { createCai } from "../actions";
import { CaiForm } from "../cai-form";

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

      <CaiForm action={createCai} submitLabel="Guardar" />
    </div>
  );
}
