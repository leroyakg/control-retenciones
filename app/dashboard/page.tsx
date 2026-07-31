import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
// import { Badge } from "@/components/ui/badge";
import { ReceiptText, AlertTriangle } from "lucide-react";

// const currency = new Intl.NumberFormat("es-HN", {
//   style: "currency",
//   currency: "HNL",
//   minimumFractionDigits: 2,
// });

function formatDate(value: string | null) {
  if (!value) return "—";
  // Date-only string ("YYYY-MM-DD"); format the parts directly so it isn't
  // shifted back a day by parsing as UTC midnight in Honduras time (UTC-6).
  const [year, month, day] = value.slice(0, 10).split("-");
  if (year && month && day) return `${day}/${month}/${year}`;
  return value;
}

type RetencionRow = {
  id: string;
  rtn: string;
  cai: string;
  fecha_documento: string;
  fecha_emision: string;
  proveedor: string | null;
  correlativo: string | null;
};

const StatCard = ({
  title,
  value,
  hint,
  icon,
  href,
}: {
  title: string;
  value: number | string;
  hint?: string;
  icon: React.ReactNode;
  href?: string;
}) => {
  const card = (
    <Card className={href ? "transition-colors hover:bg-accent/40" : undefined}>
      <CardHeader className="flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium text-foreground/70">
          {title}
        </CardTitle>
        <span className="text-foreground/40">{icon}</span>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-semibold">{value}</div>
        {hint && <p className="mt-1 text-xs text-foreground/50">{hint}</p>}
      </CardContent>
    </Card>
  );

  return href ? <Link href={href}>{card}</Link> : card;
};

const SummaryCards = async () => {
  const supabase = await createClient();

  const { data: claims, error: authError } = await supabase.auth.getClaims();
  if (authError || !claims?.claims) {
    redirect("/auth/login");
  }

  const today = new Date();
  const soon = new Date(today);
  soon.setDate(soon.getDate() + 30);
  const todayStr = today.toISOString().slice(0, 10);
  const soonStr = soon.toISOString().slice(0, 10);

  const [retenciones, caisPorVencer] =
    await Promise.all([
      supabase
        .from("retenciones")
        .select("*")
        .is("deleted_at", null),
      supabase
        .from("cais")
        .select("*", { count: "exact", head: true })
        .eq("status", "activo")
        .is("deleted_at", null)
        .gte("expiration_date", todayStr)
        .lte("expiration_date", soonStr),
    ]);

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
      <StatCard
        title="Retenciones activas"
        value={retenciones.count ?? 0}
        hint="Retenciones registradas"
        icon={<ReceiptText className="size-4" />}
      />
      <StatCard
        title="CAI por vencer"
        value={caisPorVencer.count ?? 0}
        hint="Vencen en los próximos 30 días"
        icon={<AlertTriangle className="size-4" />}
        href="/dashboard/cai"
      />
    </div>
  );
};

const RetencionesHistoric = async () => {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from("retenciones")
    .select(
      "id, rtn, cai, fecha_documento, fecha_emision, proveedor, correlativo",
    )
    // .is("deleted_at", null)
    .order("fecha_documento", { ascending: false, nullsFirst: false })
    .order("fecha_emision", { ascending: false })
    .limit(25);

  const retenciones = (data ?? []) as unknown as RetencionRow[];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Historial de retenciones</CardTitle>
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="rounded-md border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">
            No se pudo cargar el historial: {error.message}
          </p>
        ) : retenciones.length === 0 ? (
          <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
            Aún no hay retenciones registradas.
          </div>
        ) : (
          <div className="overflow-x-auto rounded-md border border-foreground/10">
            <table className="w-full text-sm">
              <thead className="border-b border-foreground/10 text-left text-foreground/60">
                <tr>
                  <th className="p-3 font-medium">Retención</th>
                  <th className="p-3 font-medium">Negocio</th>
                  <th className="p-3 font-medium">No. Factura</th>
                  <th className="p-3 font-medium">Fecha</th>
                  <th className="p-3 font-medium text-right">Monto</th>
                  <th className="p-3 font-medium text-right">Retenido</th>
                </tr>
              </thead>
              <tbody>
                {retenciones.map((r) => (
                  <tr
                    key={r.id}
                    className="border-b border-foreground/5 last:border-0 hover:bg-accent/40"
                  >
                    <td className="p-3 font-mono text-xs">{r.id}</td>
                    <td className="p-3">{r.proveedor ?? "—"}</td>
                    <td className="p-3 font-mono text-xs text-foreground/70">
                      {r.correlativo}
                    </td>
                    <td className="p-3 text-foreground/70">
                      {formatDate(r.fecha_documento)}
                    </td>
                    <td className="p-3 text-foreground/70">
                      {formatDate(r.fecha_emision)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

const cardsFallback = (
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-2">
    {Array.from({ length: 2 }).map((_, i) => (
      <Card key={i}>
        <CardContent className="p-6">
          <div className="h-4 w-24 animate-pulse rounded bg-foreground/10" />
          <div className="mt-3 h-8 w-16 animate-pulse rounded bg-foreground/10" />
        </CardContent>
      </Card>
    ))}
  </div>
);

export default function DashboardPage() {
  return (
    <div className="flex flex-col gap-6">
      <div>
        <h1 className="text-2xl font-semibold">Dashboard</h1>
        <p className="text-sm text-foreground/60">
          Resumen general del control de retenciones.
        </p>
      </div>

      <Suspense fallback={cardsFallback}>
        <SummaryCards />
      </Suspense>

      <Suspense
        fallback={
          <div className="rounded-md border border-foreground/10 p-10 text-center text-sm text-foreground/60">
            Cargando historial…
          </div>
        }
      >
        <RetencionesHistoric />
      </Suspense>
    </div>
  );
}
