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

function buildMaster(formData: FormData) {
  const text = (key: string) => (formData.get(key) as string)?.trim() || null;

  const master = {
    rtn: text("rtn"),
    cai: text("cai"),
    correlativo: text("correlativo"),
    proveedor: text("proveedor"),
    fecha_documento: text("fecha_documento"),
    fecha_emision: text("fecha_emision"),
    cai_proveedor: text("cai_proveedor"),
    correlativo_proveedor: text("correlativo_proveedor"),
    firma: text("firma"),
  };

  if (!master.proveedor || !master.rtn || !master.cai) {
    throw new Error("Proveedor, RTN y CAI son obligatorios.");
  }

  return master;
}

function buildDetalles(formData: FormData) {
  // Detail rows come as parallel arrays (repeated field names).
  const descripciones = formData.getAll("descripcion");
  const bases = formData.getAll("det_base_imponible");
  const totales = formData.getAll("det_importe_total");
  const porcentajes = formData.getAll("det_porcentaje_imponible");

  console.log("Detalles raw:", { descripciones, bases, totales, porcentajes });

  const detalles = bases
    .map((base, i) => ({
      descripcion: (descripciones[i] as string)?.trim() || null,
      base_imponible: parseNumber(base),
      importe_total: parseNumber(totales[i] ?? null),
      porcentaje: parseNumber(porcentajes[i] ?? null),
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

  // console.log("Detalles parsed:", detalles);

  return detalles;
}

export async function createRetencion(formData: FormData) {

  console.log("Creating retencion with formData:", Object.fromEntries(formData.entries()));

  const now = new Date().toISOString();
  const master = buildMaster(formData);
  const detalles = buildDetalles(formData);

  const supabase = await createClient();

  // obtener el id del cai
  const { data: caiData, error: caiError } = await supabase
    .from("cais")
    .select("id, correlativo_actual, rango_final, fecha_emision, fecha_expiracion")
    .eq("cai", master.cai)
    .single();

  if (caiError) {
    throw new Error(caiError.message);
  }

  if (!caiData) {
    throw new Error(`No se encontró un CAI activo con el valor '${master.cai}'.`);
  }

  // if (master.fecha_emision && caiData.fecha_emision && caiData.fecha_emision < master.fecha_emision) {
  //   throw new Error(`La fecha de emisión de la retención (${master.fecha_emision}) no puede ser anterior a la fecha de emisión del CAI (${caiData.fecha_emision}).`);
  // }

  // if (master.fecha_emision && master.fecha_emision > caiData.fecha_expiracion) {
  //   throw new Error(`La fecha de emisión de la retención (${master.fecha_emision}) no puede ser posterior a la fecha de expiración del CAI (${caiData.fecha_expiracion}).`);
  // }

  // if (caiData.correlativo_actual > caiData.rango_final) {
  //   throw new Error(`El CAI '${master.cai}' ha alcanzado su límite de correlativos y no puede generar más retenciones.`);
  // }

  const { data: created, error } = await supabase
    .from("retenciones")
    .insert({ ...master, create_time: now, update_time: now })
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
    porcentaje_imponible: d.porcentaje ?? 0,
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

  const correlativoActual = (caiData.correlativo_actual ?? 0) + 1;

  // let fechaExpiracion: string | null = null;
  let estatus = "activo";

  if (caiData.rango_final < correlativoActual) {
    // fechaExpiracion = new Date().toISOString();
    estatus = "agotado";
  }

  // incrementar el correlativo_actual del CAI utilizado
  const { error: updateCaiError } = await supabase
    .from("cais")
    .update({
      correlativo_actual: correlativoActual,
      estatus: estatus,
      update_time: new Date().toISOString(),
    })
    .eq("id", caiData.id);

  if (updateCaiError) {
    throw new Error(updateCaiError.message);
  }

  revalidatePath("/dashboard/retenciones");
  redirect("/dashboard/retenciones");
}

export async function updateRetencion(id: number, formData: FormData) {

  const now = new Date().toISOString();
  const master = buildMaster(formData);
  const detalles = buildDetalles(formData);

  const supabase = await createClient();

  const { error } = await supabase
    .from("retenciones")
    .update({ ...master, update_time: now })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  // Replace the detail rows wholesale — simpler and safe at this scale.
  const { error: delError } = await supabase
    .from("retenciones_detalle")
    .delete()
    .eq("retencion_id", id);

  if (delError) {
    throw new Error(delError.message);
  }

  const detallePayload = detalles.map((d) => ({
    retencion_id: id,
    descripcion: d.descripcion,
    base_imponible: d.base_imponible ?? 0,
    importe_total: d.importe_total ?? 0,
    porcentaje_imponible: d.porcentaje ?? 0,
    create_time: now,
    update_time: now,
  }));

  const { error: detError } = await supabase
    .from("retenciones_detalle")
    .insert(detallePayload);

  if (detError) {
    throw new Error(detError.message);
  }

  console.log("Retención actualizada:", { id, master, detalles });

  revalidatePath(`/dashboard/retenciones/${id}/editar`);
  revalidatePath(`/imprimir/retenciones/${id}`);
  revalidatePath("/dashboard/retenciones");
  redirect("/dashboard/retenciones");
}

export async function validarRetencion(id: number) {
  const now = new Date().toISOString();
  const supabase = await createClient();

  const { error } = await supabase
    .from("retenciones")
    .update({ procesado: true, update_time: now })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/retenciones/${id}/editar`);
  revalidatePath(`/imprimir/retenciones/${id}`);
  revalidatePath("/dashboard/retenciones");
}

export async function anularRetencion(id: number) {
  const now = new Date().toISOString();
  const supabase = await createClient();

  const { error } = await supabase
    .from("retenciones")
    .update({ fecha_anulacion: now, update_time: now })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath(`/dashboard/retenciones/${id}/editar`);
  revalidatePath(`/imprimir/retenciones/${id}`);
  revalidatePath("/dashboard/retenciones");
}

export async function deleteRetencion(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();

  // retenciones has no soft-delete column — remove the detail rows first,
  // then the parent, so we never leave an orphaned detalle behind.
  const { error: detError } = await supabase
    .from("retenciones_detalle")
    .delete()
    .eq("retencion_id", id);

  if (detError) {
    throw new Error(detError.message);
  }

  const { error } = await supabase.from("retenciones").delete().eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/retenciones");
}
