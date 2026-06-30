"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

export async function createDistributor(formData: FormData) {
  const get = (key: string) => (formData.get(key) as string)?.trim() || null;

  const payload = {
    nickname: get("nickname"),
    address: get("address"),
    city: get("city"),
    postcode: get("postcode"),
    phone_number: get("phone_number"),
    state: get("state"),
    country: get("country"),
    status: get("status") ?? "activo",
    soft_delete: 0,
    create_time: new Date().toISOString(),
    update_time: new Date().toISOString(),
  };

  const supabase = await createClient();
  const { error } = await supabase.from("distributor").insert(payload);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/proveedores");
  redirect("/dashboard/proveedores");
}

export async function deleteDistributor(formData: FormData) {
  const id = formData.get("id") as string;
  if (!id) return;

  const supabase = await createClient();
  // Soft delete — flag the row, don't remove it.
  const { error } = await supabase
    .from("distributor")
    .update({
      soft_delete: 1,
      delete_time: new Date().toISOString(),
      update_time: new Date().toISOString(),
    })
    .eq("id", id);

  if (error) {
    throw new Error(error.message);
  }

  revalidatePath("/dashboard/proveedores");
}
