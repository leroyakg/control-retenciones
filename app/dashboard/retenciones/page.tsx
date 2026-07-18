import { Suspense } from "react";
import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Plus } from "lucide-react";
// import RetencionesTable from "./retenciones-table";


// type Retencion = {
//   id: string;
//   fecha_documento: string;
//   fecha_emisión: string;
//   cai: string;
//   rtn: string;
//   correlativo: string;
//   firma: string;
// }

export default function RetencionesPage() {
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

      <Suspense fallback={
        <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
          Cargando retenciones…
        </div>
      }>
        {/* <RetencionesTable /> */}
      </Suspense>
    </div>
  );
}