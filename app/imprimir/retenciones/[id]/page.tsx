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
import logo from "@/img/logo_lcp_og_crop_no_bckgrd.png"; //
import { createAdminClient } from "@/lib/supabase/admin";
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
  // Date-only string ("YYYY-MM-DD"); format the parts directly so it isn't
  // shifted back a day by parsing as UTC midnight in Honduras time (UTC-6).
  const [year, month, day] = value.slice(0, 10).split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return value;
}

const ReciboRetencion = async ({
  params,
}: {
  params: Promise<{ id: string }>;
}) => {
  const { id } = await params;
  const supabase = await createClient();

  const { data: claims, error: authError } = await supabase.auth.getClaims();

  console.log({
    name: claims?.claims?.user_metadata?.first_name,
    sub: claims?.claims?.sub,
  })
  
  const user = claims?.claims?.user_metadata?.first_name ?? "Usuario Sistema";

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

  // const { data: userData, error: userError } = await supabase.auth.admin.getUserById(retencion.aprobado_por ?? userId);

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

  const admin = createAdminClient();

  const aprobadoPor = retencion.aprobado_por
  ? await admin.auth.admin.getUserById(retencion.aprobado_por)
  : null;

  const anuladoPor = retencion.anulado_por
  ? await admin.auth.admin.getUserById(retencion.anulado_por)
  : null;

  return (
    <>
      <div className="print:hidden mb-6 flex items-center justify-between">
        <Button asChild variant="ghost">
          <Link href="/dashboard/retenciones">
            <ArrowLeft className="size-4" />
            Volver
          </Link>
        </Button>
      </div>

      <PrintControls
        retencionId={retencion.id}
        procesado={retencion.procesado}
        anulado={retencion.fecha_anulacion != null}
        aprobadoPor={aprobadoPor?.data?.user?.user_metadata?.first_name ?? null}
        anuladoPor={anuladoPor?.data?.user?.user_metadata?.first_name ?? null}
        user={user}
      >
        <div className="mx-auto flex max-w-2xl flex-col gap-6 rounded-md border border-foreground/10 p-8 print:border-0 print:p-0">
          <header className="flex flex-col items-center gap-2 border-b border-foreground/10 pb-4 text-center">
            <Image
              src={logo}
              alt="La Casa del Panadero"
              width={264}
              height={128}
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
              Rango autorizado: {formatCorrelativo(cais.prefijo, cais.rango_inicial)} al {formatCorrelativo(cais.prefijo, cais.rango_final)}
              <br />
              Fecha limite de Emision: {formatDate(cais.fecha_expiracion)}
              <br />
              CAI: {cais.cai} &nbsp;
            </p>

            <h2 className="mt-2 text-base font-semibold">
              Comprobante de Retención
            </h2>
            <div>
              <p className="text-xs leading-snug text-foreground/70">
                No. {retencion.correlativo}
                <br />

              </p>
            </div>
          </header>



          <section className="gap-x-6 gap-y-3 text-sm">

            <div className="mb-2 text-sm">
              <p className="text-foreground/60 font-bold">Fecha de emisión: &nbsp;
                <span className="ml-3 font-mono font-medium">{formatDate(retencion.fecha_emision)}</span>
              </p>
            </div>

            <div className="mb-2 text-sm">
              <p className="text-foreground/60 font-bold">
                Nombre del Proveedor: &nbsp;<span className="ml-3 font-mono font-medium">{retencion.proveedor}</span>
              </p>
            </div>

            <div className="mb-2 text-sm">
              <p className="text-foreground/60 font-bold">
                R.T.N. Del Proveedor: <span className="ml-3 font-mono font-medium">{retencion.rtn}</span>
              </p>
            </div>

            <div className="mb-2 text-sm">
              <p className="text-foreground/60 font-bold">
                No Correlativo Del Comprobante: <span className="ml-3 font-mono font-medium">{retencion.correlativo_proveedor}</span>
              </p>
            </div>

            <div className="mb-2 text-sm">
              <p className="text-foreground/60 font-bold">
                Fecha de Emisión Del Comprobante: &nbsp;<span className="ml-3 font-mono font-medium">{formatDate(retencion.fecha_documento)}</span></p>
            </div>

            <div className="mb-2 text-sm">
              <p className="text-foreground/60 font-bold">
                CAI Del Comprobante: <span className="ml-3 font-mono text-xs font-medium">{retencion.cai_proveedor ?? "—"}</span>
              </p>
            </div>

          </section>

          <section>

            <table className="w-full border-collapse text-sm">
              <thead className="bg-foreground/5 text-left text-foreground/70">
                <tr>
                  <th className="text-xs border border-foreground/30 px-3 py-2 font-semibold">Descripción del Impuesto Retenido</th>
                  <th className="text-xs border border-foreground/30 px-3 py-2 font-semibold text-right">Base imponible</th>
                  <th className="text-xs border border-foreground/30 px-3 py-2 font-semibold text-right">% de Retencion</th>
                  <th className="text-xs border border-foreground/30 px-3 py-2 font-semibold text-right">Importe Total Retenido</th>
                </tr>
              </thead>
              <tbody>
                {detalles.map((d) => (
                  <tr key={d.id}>
                    <td className="text-xs border border-foreground/30 px-3 py-2">{d.descripcion ?? "—"}</td>
                    <td className="text-xs border border-foreground/30 px-3 py-2 text-right tabular-nums">
                      {currency.format(Number(d.base_imponible) || 0)}
                    </td>
                    <td className="text-xs border border-foreground/30 px-3 py-2 text-right tabular-nums">
                      {d.porcentaje_imponible ? `${d.porcentaje_imponible}%` : "—"}
                    </td>
                    <td className="text-xs border border-foreground/30 px-3 py-2 text-right tabular-nums">
                      {currency.format(Number(d.importe_total) || 0)}
                    </td>
                  </tr>
                ))}
                {/* Mostrar una linea que diga final del detalle */}
                <tr>
                  <td className="text-xs border border-foreground/30 px-3 py-2 text-foreground/60 text-center" colSpan={4}>
                    ---------— Ultima Linea —---------
                  </td>
                </tr>
              </tbody>
              <tfoot>
                <tr>
                  <td className="text-xs border border-foreground/30 px-3 py-2 font-semibold" colSpan={3}>
                    Total Retenido
                  </td>
                  <td className="text-xs border border-foreground/30 px-3 py-2 text-right font-semibold tabular-nums">
                    {currency.format(total)}
                  </td>
                </tr>
              </tfoot>
            </table>
          </section>

          <footer className="mt-8 flex flex-col items-center gap-1 pt-8 text-sm">
            <div className="w-64 border-t border-foreground/40 pt-1 text-center">
              {/* {retencion.firma || "Firma autorizada"} */}
              Firma
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
