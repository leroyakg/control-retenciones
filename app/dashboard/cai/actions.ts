"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createCai(formData: FormData) {
  const get = (key: string) => (formData.get(key) as string)?.trim() || null;

  const payload = {
    cai_id: get("cai_id"),
    bloque: get("bloque"),
    distributor_id: get("distributor_id"),
    merchant_id: get("merchant_id"),
    company_id: get("company_id"),
    start_from: get("start_from"),
    end_from: get("end_from"),
    emission_date: get("emission_date"),
    expiration_date: get("expiration_date"),
    status: get("status") ?? "activo",
  };

  const supabase = await createClient();
  const { error } = await supabase.from("cais").insert(payload);

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
    .update({ deleted_at: new Date().toISOString(), updated_at: new Date().toISOString() })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/cai");
}
