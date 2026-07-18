"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

const ESTATUS = ["activo", "vencido", "agotado", "anulado"] as const;

function buildPayload(formData: FormData) {
  const text = (key: string) => (formData.get(key) as string)?.trim() || null;
  const int = (key: string) => {
    const raw = (formData.get(key) as string)?.trim();
    if (!raw) return null;
    const n = Number.parseInt(raw, 10);
    return Number.isNaN(n) ? null : n;
  };

  const estatus = text("estatus");

  return {
    cai: text("cai"),
    bloque: text("bloque"),
    prefijo: text("prefijo"),
    rango_inicial: int("rango_inicial"),
    rango_final: int("rango_final"),
    fecha_emision: text("fecha_emision"),
    fecha_expiracion: text("fecha_expiracion"),
    estatus:
      estatus && (ESTATUS as readonly string[]).includes(estatus)
        ? estatus
        : "activo",
  };
}

export async function createCai(formData: FormData) {
  const payload = {
    ...buildPayload(formData),
    create_time: new Date().toISOString(),
    update_time: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("cais").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/cai");
  redirect("/dashboard/cai");
}

export async function updateCai(id: string, formData: FormData) {
  if (!id) throw new Error("Falta el identificador del CAI.");

  const payload = {
    ...buildPayload(formData),
    update_time: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("cais").update(payload).eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/cai");
  redirect("/dashboard/cai");
}

export async function deleteCai(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  // Soft delete — keep the row, flag it as removed.
  const { error } = await supabase
    .from("cais")
    .update({
      delete_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/cai");
}
