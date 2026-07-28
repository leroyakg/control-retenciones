import { redirect } from "next/navigation";
import { notFound } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Suspense } from "react";
import { createClient } from "@/lib/supabase/server";
import { Button } from "@/components/ui/button";
import { ArrowLeft } from "lucide-react";
import { PrintControls } from "./auto-print";
import type { RetencionDetalleRecord, RetencionRecord } from "@/app/dashboard/retenciones/types";
import logo from "@/img/icon_no_background.png";
// import { CaiRecord } from "@/app/dashboard/cai/types";

const currency = new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL",
  minimumFractionDigits: 2,
});

const formatCorrelativo = (prefijo: string, correlativo: number) => {

  // console.log({ Cai: cai })

  if (!prefijo) return "";
  if (correlativo === null || correlativo === undefined) return "";
  const seq = String(correlativo).padStart(8, "0");
  return `${prefijo}-${seq}`;
};

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

const ReciboRetencion = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims) {
    redirect("/auth/login");
  }

  const [retencionRes, detalleRes] = await Promise.all([
    supabase.from("retenciones").select("*").eq("id", id).maybeSingle(),
    supabase
      .from("retenciones_detalle")
      .select("*")
      .eq("retencion_id", id)
      .order("id", { ascending: true }),
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

  // const cais = caiRes.data;

  const retencion = retencionRes.data as RetencionRecord;
  const detalles = (detalleRes.data ?? []) as RetencionDetalleRecord[];

  const [caiRes] = await Promise.all([
    supabase
      .from("cais")
      .select("*")
      .eq("cai", retencion.cai)
      .is("delete_time", null)
      .order("create_time", { ascending: false })
      .limit(1)
      .maybeSingle(),
  ]);

  if (caiRes.error) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        No se pudo cargar el CAI: {caiRes.error.message}
      </p>
    );
  }

  if (!caiRes.data) {
    return (
      <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
        No hay un CAI activo.
      </p>
    );
  }

  const cais = caiRes.data;

  const total = detalles.reduce(
    (sum, d) => sum + (Number(d.importe_total) || 0),
    0,
  );

  return (
    <>
      {/* <AutoPrint /> */}

      <div className="print:hidden mb-6 flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href="/dashboard/retenciones">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
      </div>

      <PrintControls>
        <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-md border border-foreground/10 p-8 print:border-0 print:p-0">
          <header className="flex flex-col items-center gap-2 border-b border-foreground/10 pb-4 text-center">
            <Image
              src={logo}
              alt="La Casa del Panadero"
              width={64}
              height={68}
              className="mb-1"
            />
            <h1 className="text-xl font-bold underline underline-offset-2">
              La Casa del Panadero S. de R.L.
            </h1>
            <p className="text-xs leading-snug text-foreground/70">
              Bo. Abajo, 2da Ave. 2-3 Calle, atrás del edificio antiguo de Aguas
              de Siguatepeque,
              <br />
              Siguatepeque, Comayagua, Honduras, C.A.
              <br />
              R.T.N. 08019009225129 &nbsp; Cel: 9595-4000
              <br />
              E-mail: administracion@lacasadelpanadero.com
              <br />
              Rango autorizado: {formatCorrelativo(cais.prefijo, cais.rango_inicial)} - {formatCorrelativo(cais.prefijo, cais.rango_final)}
              <br />
              CAI: {cais.cai} &nbsp;
            </p>

            <h2 className="mt-2 text-base font-semibold">
              Comprobante de Retención
            </h2>
            <div>
              <p className="text-xs leading-snug text-foreground/70">
                {formatCorrelativo(cais.prefijo, cais.correlativo_actual)}
                <br />

              </p>
            </div>
          </header>



          <section className="grid grid-cols-2 gap-x-6 gap-y-3 text-sm">
            <div>
              <span className="text-foreground/60">Proveedor</span>
              <p className="font-mono font-medium">{retencion.proveedor}</p>
            </div>
            <div>
              <span className="text-foreground/60">RTN</span>
              <p className="font-mono font-medium">{retencion.rtn}</p>
            </div>
            <div>
              <span className="text-foreground/60">CAI</span>
              <p className="font-mono text-xs font-medium">{retencion.cai_proveedor ?? "—"}</p>
            </div>
            <div>
              <span className="text-foreground/60">Correlativo</span>
              <p className="font-mono text-xs font-medium">
                {retencion.correlativo_proveedor ?? "—"}
              </p>
            </div>
            <div>
              <span className="text-foreground/60">Fecha del documento</span>
              <p className="font-mono font-medium">{formatDate(retencion.fecha_documento)}</p>
            </div>
            <div>
              <span className="text-foreground/60">Fecha de emisión</span>
              <p className="font-mono font-medium">{formatDate(retencion.fecha_emision)}</p>
            </div>
          </section>

          <section>
            <table className="w-full text-sm">
              <thead className="border-b border-foreground/10 text-left text-foreground/60">
                <tr>
                  <th className="py-2 font-medium">Descripción</th>
                  <th className="py-2 font-medium text-right">Base imponible</th>
                  <th className="py-2 font-medium text-right">Importe</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d) => (
                  <tr key={d.id} className="border-b border-foreground/5">
                    <td className="py-2">{d.descripcion ?? "—"}</td>
                    <td className="py-2 text-right tabular-nums">
                      {currency.format(Number(d.base_imponible) || 0)}
                    </td>
                    <td className="py-2 text-right tabular-nums">
                      {currency.format(Number(d.importe_total) || 0)}
                    </td>
                  </tr>
                ))}
                {/* Mostrar una linea que diga final del detalle */}
                <tr>
                  <td className="py-2 text-foreground/60 text-center" colSpan={3}>
                    — fin del detalle —
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="pt-3 font-medium" colSpan={2}>
                    Total retenido
                  </td>
                  <td className="pt-3 text-right font-medium tabular-nums">
                    {currency.format(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          <footer className="mt-8 flex flex-col items-center gap-1 pt-8 text-sm">
            <div className="w-64 border-t border-foreground/40 pt-1 text-center">
              {retencion.firma || "Firma autorizada"}
            </div>

          </footer>
        </div>
      </PrintControls>
    </>
  );
};

export default function ImprimirRetencionPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  return (
    <div className="min-h-screen p-6 print:p-0">
      <Suspense
        fallback={
          <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
            Cargando…
          </div>
        }
      >
        <ReciboRetencion params={params} />
      </Suspense>
    </div>
  );
}
