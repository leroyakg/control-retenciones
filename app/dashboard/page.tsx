import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Suspense } from "react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Store, Truck, ReceiptText, AlertTriangle } from "lucide-react";

const currency = new Intl.NumberFormat("es-HN", {
  style: "currency",
  currency: "HNL",
  minimumFractionDigits: 2,
});

function formatDate(value: string | null) {
  if (!value) return "—";
  return new Date(value).toLocaleDateString("es-HN", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

type RetencionRow = {
  id: string;
  retencion_id: string;
  no_factura: string;
  date: string | null;
  amount: number;
  retain_amount: number;
  created_at: string;
  merchant: { nickname: string } | null;
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

  const [merchants, distributors, retenciones, caisPorVencer] =
    await Promise.all([
      supabase
        .from("merchant")
        .select("*", { count: "exact", head: true })
        .or("soft_delete.is.null,soft_delete.eq.0"),
      supabase
        .from("distributor")
        .select("*", { count: "exact", head: true })
        .or("soft_delete.is.null,soft_delete.eq.0"),
      supabase
        .from("retenciones")
        .select("*", { count: "exact", head: true })
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
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      <StatCard
        title="Negocios"
        value={merchants.count ?? 0}
        hint="Negocios registrados"
        icon={<Store className="size-4" />}
        href="/dashboard/empresas"
      />
      <StatCard
        title="Proveedores"
        value={distributors.count ?? 0}
        hint="Distribuidores e imprentas"
        icon={<Truck className="size-4" />}
        href="/dashboard/proveedores"
      />
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
      "id, retencion_id, no_factura, date, amount, retain_amount, created_at, merchant:merchant_id(nickname)",
    )
    .is("deleted_at", null)
    .order("date", { ascending: false, nullsFirst: false })
    .order("created_at", { ascending: false })
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
                    <td className="p-3 font-mono text-xs">{r.retencion_id}</td>
                    <td className="p-3">{r.merchant?.nickname ?? "—"}</td>
                    <td className="p-3 font-mono text-xs text-foreground/70">
                      {r.no_factura}
                    </td>
                    <td className="p-3 text-foreground/70">
                      {formatDate(r.date)}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      {currency.format(r.amount)}
                    </td>
                    <td className="p-3 text-right tabular-nums">
                      <Badge variant="secondary">
                        {currency.format(r.retain_amount)}
                      </Badge>
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
  <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
    {Array.from({ length: 4 }).map((_, i) => (
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
