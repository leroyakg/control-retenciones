import { EnvVarWarning } from "@/components/env-var-warning";
import { AuthButton } from "@/components/auth-button";
import { ThemeSwitcher } from "@/components/theme-switcher";
import { Button } from "@/components/ui/button";
import { hasEnvVars } from "@/lib/utils";
import { FileText, PieChart, ShieldCheck } from "lucide-react";
import Link from "next/link";
import { Suspense } from "react";
import { DeployButton } from "@/components/deploy-button";

const features = [
  {
    icon: FileText,
    title: "Registro de retenciones",
    description:
      "Cargá cada retención sufrida o practicada con su comprobante, fecha e importe.",
  },
  {
    icon: PieChart,
    title: "Resumen por período",
    description:
      "Visualizá totales por mes e impuesto para preparar tus declaraciones sin sorpresas.",
  },
  {
    icon: ShieldCheck,
    title: "Datos seguros",
    description:
      "Tu información queda guardada y protegida en tu cuenta, accesible solo por vos.",
  },
];

export default function Home() {
  return (
    <main className="min-h-screen flex flex-col items-center">
      <div className="flex-1 w-full flex flex-col items-center">
        <nav className="w-full flex justify-center border-b border-b-foreground/10 h-16">
          <div className="w-full max-w-5xl flex justify-between items-center p-3 px-5 text-sm">
            <Link href={"/"} className="font-semibold">
              Control de Retenciones
            </Link>
            {!hasEnvVars ? (
              <EnvVarWarning />
            ) : (
              <Suspense>
                <AuthButton />
              </Suspense>
            )}

            Deployed on{" "}
            <DeployButton />
            <ThemeSwitcher />
          </div>
        </nav>

        <div className="flex-1 w-full flex flex-col items-center gap-16 max-w-5xl px-5 py-20">
          <section className="flex flex-col items-center gap-6 text-center">
            <span className="text-sm font-medium text-foreground/60">
              Tu app personal de gestión
            </span>
            <h1 className="text-4xl lg:text-5xl font-bold !leading-tight max-w-2xl">
              Llevá el control de tus retenciones en un solo lugar
            </h1>
            <p className="text-lg text-foreground/70 max-w-xl">
              Registrá, organizá y consultá tus retenciones de impuestos de
              forma simple. Sin planillas dispersas ni cálculos a mano.
            </p>
            <div className="flex gap-3 mt-2">
              <Button asChild size="lg">
                <Link href="/dashboard">Ir al panel</Link>
              </Button>
              {!hasEnvVars ? null : (
                <Button asChild size="lg" variant="outline">
                  <Link href="/auth/login">Iniciar sesión</Link>
                </Button>
              )}
            </div>
          </section>

          <section className="grid gap-6 sm:grid-cols-3 w-full">
            {features.map(({ icon: Icon, title, description }) => (
              <div
                key={title}
                className="flex flex-col gap-3 rounded-lg border border-foreground/10 p-6"
              >
                <Icon className="size-6 text-foreground/80" />
                <h2 className="font-medium">{title}</h2>
                <p className="text-sm text-foreground/70">{description}</p>
              </div>
            ))}
          </section>
        </div>

        <footer className="w-full flex items-center justify-center border-t mx-auto text-center text-xs gap-4 py-8">
          <p className="text-foreground/60">
            Control de Retenciones — Casa del Panadero : Hecho con ❤️ por{" "}
            <a
              href="leroykilgore.xyz"
              target="_blank"
              rel="noopener noreferrer"
              className="underline underline-offset-4"
            >
              Leroy Kilgore
            </a>
          </p>
          <ThemeSwitcher />
        </footer>
      </div>
    </main>
  );
}
