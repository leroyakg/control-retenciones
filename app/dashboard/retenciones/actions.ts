"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

function parseNumber(value: FormDataEntryValue | null): number | null {
  const raw = (value as string)?.trim();
  if (!raw) return null;
  const n = Number(raw);
  return Number.isNaN(n) ? null : n;
}

export async function createRetencion(formData: FormData) {
  const text = (key: string) => (formData.get(key) as string)?.trim() || null;

  const now = new Date().toISOString();

  const master = {
    rtn: text("rtn"),
    cai: text("cai"),
    correlativo: text("correlativo"),
    proveedor: text("proveedor"),
    fecha_documento: text("fecha_documento"),
    fecha_emision: text("fecha_emision"),
    firma: text("firma"),
    create_time: now,
    update_time: now,
  };

  if (!master.proveedor || !master.rtn || !master.cai) {
    throw new Error("Proveedor, RTN y CAI son obligatorios.");
  }

  // Detail rows come as parallel arrays (repeated field names).
  const descripciones = formData.getAll("descripcion");
  const bases = formData.getAll("det_base_imponible");
  const totales = formData.getAll("det_importe_total");

  const detalles = bases
    .map((base, i) => ({
      descripcion: (descripciones[i] as string)?.trim() || null,
      base_imponible: parseNumber(base),
      importe_total: parseNumber(totales[i] ?? null),
    }))
    .filter(
      (d) =>
        d.descripcion !== null ||
        d.base_imponible !== null ||
        d.importe_total !== null,
    );

  if (detalles.length === 0) {
    throw new Error("Agregá al menos un registro de detalle.");
  }

  const supabase = await createClient();

  const { data: created, error } = await supabase
    .from("retenciones")
    .insert(master)
    .select("id")
    .single();

  if (error) {
    throw new Error(error.message);
  }

  const detallePayload = detalles.map((d) => ({
    retencion_id: created.id,
    descripcion: d.descripcion,
    base_imponible: d.base_imponible ?? 0,
    importe_total: d.importe_total ?? 0,
    create_time: now,
    update_time: now,
  }));

  const { error: detError } = await supabase
    .from("retenciones_detalle")
    .insert(detallePayload);

  if (detError) {
    // Best-effort rollback of the parent so we don't leave an orphan.
    await supabase.from("retenciones").delete().eq("id", created.id);
    throw new Error(detError.message);
  }

  // obtener el id del cai
  const { data: caiData, error: caiError } = await supabase
    .from("cais")
    .select("id, correlativo_actual")
    .eq("cai", master.cai)
    .single();

  if (caiError) {
    throw new Error(caiError.message);
  }

  // incrementar el correlativo_actual del CAI utilizado
  const { error: updateCaiError } = await supabase
    .from("cais")
    .update({ correlativo_actual: caiData.correlativo_actual !== null ? caiData.correlativo_actual + 1 : 0 })
    .eq("id", caiData.id);

  if (updateCaiError) {
    throw new Error(updateCaiError.message);
  }

  revalidatePath("/dashboard/retenciones");
  redirect("/dashboard/retenciones");
}
