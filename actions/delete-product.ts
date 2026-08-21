"use server";

import { createClient } from "@/lib/supabase/server";
import { revalidatePath } from "next/cache";

export async function deleteProduct(id: string) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return { success: false, message: "Unauthorized" };

  const { data: organisation } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .single();

  if (!organisation) return { success: false, message: "Organisation not found" };

  // 1. Delete associated payment orders
  await supabase
    .from("payment_orders")
    .delete()
    .eq("product_id", id);

  // 2. Delete product
  const { error } = await supabase
    .from("products")
    .delete()
    .eq("id", id)
    .eq("organisation_id", organisation.id);

  if (error) {
    return { success: false, message: error.message };
  }

  revalidatePath("/dashboard/products");
  return { success: true };
}
