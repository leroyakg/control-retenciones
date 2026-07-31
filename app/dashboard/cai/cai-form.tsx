"use client";

import { useState } from "react";
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
  editMode,
  action,
  cai,
  submitLabel = "Guardar",
  presetValues,
  previousCai,
}: {
  editMode?: boolean;
  action: (formData: FormData) => void;
  cai?: CaiRecord;
  submitLabel?: string;
  presetValues?: CaiRecord;
  previousCai?: string | null;
}) {
  const [error, setError] = useState<string | null>(null);

  function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    const value = (
      (new FormData(event.currentTarget).get("cai") as string) ?? ""
    ).trim();

    if (previousCai && value === previousCai.trim()) {
      // Block the server action and warn before it hits the unique constraint
      // on the `cai` code.
      event.preventDefault();
      setError("El CAI no debe ser igual al CAI anterior.");
      return;
    }

    setError(null);
  }

  return (
    <form action={action} onSubmit={handleSubmit} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <div className="flex flex-col gap-2">
          <Label htmlFor="cai">CAI</Label>
          <Input
            id="cai"
            name="cai"
            disabled={!editMode}
            placeholder="7F92-AB34-XX11"
            defaultValue={cai?.cai ?? ""}
            aria-invalid={error ? true : undefined}
            required
          />
          {error && <p className="text-sm text-destructive">{error}</p>}
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="bloque">Nombre del bloque</Label>
          <Input
            id="bloque"
            name="bloque"
            disabled={!editMode}
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
            disabled={!editMode}
            defaultValue={presetValues?.prefijo ?? cai?.prefijo ?? ""}
          />
        </div>
        <div className="flex flex-col gap-2">
          <Label htmlFor="estatus">Estado</Label>
          <select
            id="estatus"
            name="estatus"
            className={selectClass}
            disabled={!editMode}
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
            disabled={!editMode}
            defaultValue={presetValues?.rango_final !== undefined ? presetValues.rango_final + 1 : cai?.rango_inicial ?? ""}
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
            disabled={!editMode}
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
            disabled={!editMode}
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
            disabled={!editMode}
            defaultValue={toDateInput(cai?.fecha_expiracion)}
            required
          />
        </div>
      </div>

      <div className="flex gap-3 pt-2">

        {editMode && <Button type="submit">{submitLabel}</Button>}
        <Button asChild variant="outline" type="button">
          <Link href="/dashboard/cai">Cancelar</Link>
        </Button>
      </div>
    </form>
  );
}
