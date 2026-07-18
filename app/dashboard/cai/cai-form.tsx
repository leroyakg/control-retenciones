import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import Link from "next/link";
import { ESTATUS, type CaiRecord } from "./types";

const selectClass =
  "flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:cursor-not-allowed disabled:opacity-50";

function toDateInput(value: string | null | undefined) {
  if (!value) return undefined;
  return value.slice(0, 10);
}

export function CaiForm({
  action,
  cai,
  submitLabel = "Guardar",
}: {
  action: (formData: FormData) => void;
  cai?: CaiRecord;
  submitLabel?: string;
}) {
  return (
    <form action={action} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cai">CAI</Label>
          <Input
            id="cai"
            name="cai"
            placeholder="7F92-AB34-XX11"
            defaultValue={cai?.cai ?? ""}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bloque">Nombre del bloque</Label>
          <Input
            id="bloque"
            name="bloque"
            placeholder="Retenciones 2026"
            defaultValue={cai?.bloque ?? ""}
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="prefijo">Prefijo</Label>
          <Input
            id="prefijo"
            name="prefijo"
            placeholder="000-001-01"
            defaultValue={cai?.prefijo ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="estatus">Estado</Label>
          <select
            id="estatus"
            name="estatus"
            className={selectClass}
            defaultValue={cai?.estatus ?? "activo"}
          >
            {ESTATUS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="rango_inicial">Rango inicial</Label>
          <Input
            id="rango_inicial"
            name="rango_inicial"
            type="number"
            min={0}
            step={1}
            placeholder="1"
            defaultValue={cai?.rango_inicial ?? ""}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="rango_final">Rango final</Label>
          <Input
            id="rango_final"
            name="rango_final"
            type="number"
            min={0}
            step={1}
            placeholder="500"
            defaultValue={cai?.rango_final ?? ""}
            required
          />
        </div>
      </div>

      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha_emision">Fecha de emisión</Label>
          <Input
            id="fecha_emision"
            name="fecha_emision"
            type="date"
            defaultValue={toDateInput(cai?.fecha_emision)}
            required
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="fecha_expiracion">Fecha de vencimiento</Label>
          <Input
            id="fecha_expiracion"
            name="fecha_expiracion"
            type="date"
            defaultValue={toDateInput(cai?.fecha_expiracion)}
            required
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">
        <Button type="submit">{submitLabel}</Button>
        <Button asChild variant="outline" type="button">
          <Link href="/dashboard/cai">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
