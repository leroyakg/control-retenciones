import { Suspense } from "react";

export default function ReportesPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Reportes</h1>
        <p className="text-sm text-foreground/60">
          Reportes de retenciones registradas en el sistema.
        </p>
      </div>

      <Suspense fallback={
        <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
          Cargando reportes…
        </div>
      }>
        {/* <ReportesTable /> */}
      </Suspense>
    </div>
  );
}