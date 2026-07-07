"use server";

import { createCheckoutOrder } from "@/lib/nomba";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";

export async function initiateSubscriptionPayment(formData: FormData) {
  const planId = String(formData.get("planId") || "");

  const productId = String(formData.get("productId") || "");

  const email = String(formData.get("email") || "")
    .trim()
    .toLowerCase();

  const firstName = String(formData.get("firstName") || "").trim();

  const lastName = String(formData.get("lastName") || "").trim();

  if (!planId || !productId || !email || !firstName || !lastName) {
    throw new Error("Please complete all required details.");
  }

  if (!email.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const supabase = supabaseAdmin;

  /*
   * Verify plan and product.
   */

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      `
        id,
        amount,
        product_id,
        organisation_id,
        is_active,
        products!plans_product_id_fkey (
          id,
          slug,
          is_active
        )
        `,
    )
    .eq("id", planId)
    .single();

  if (planError || !plan) {
    console.error("PLAN LOOKUP FAILED:", planError);

    throw new Error("Plan could not be verified.");
  }

  if (!plan.is_active) {
    throw new Error("This plan is unavailable.");
  }

  const product = plan.products as unknown as {
    id: string;
    slug: string;
    is_active: boolean;
  };

  if (!product || product.id !== productId) {
    throw new Error("Invalid product selection.");
  }

  if (!product.is_active) {
    throw new Error("This product is unavailable.");
  }

  /*
   * Create Nomba checkout.
   */

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  const callbackUrl = `${appUrl}/checkout/${product.slug}/success`;

  const checkoutData = await createCheckoutOrder({
    amount: Number(plan.amount),

    customerEmail: email,

    callbackUrl,

    productId: plan.product_id,

    planId: plan.id,
  });

  if (!checkoutData.checkoutUrl) {
    throw new Error("Unable to create payment checkout.");
  }

  /*
   * Save pending payment.
   *
   * This connects:
   *
   * Nomba payment
   * ->
   * customer identity
   * ->
   * plan
   */

  const { error: paymentOrderError } = await supabase
    .from("payment_orders")
    .insert({
      order_reference: checkoutData.orderReference,

      plan_id: plan.id,

      product_id: plan.product_id,

      customer_email: email,

      customer_first_name: firstName,

      customer_last_name: lastName,

      status: "pending",
    });

  if (paymentOrderError) {
    console.error("PAYMENT ORDER CREATE FAILED:", paymentOrderError);

    throw new Error("Could not create payment record.");
  }

  console.log("PAYMENT ORDER CREATED", {
    reference: checkoutData.orderReference,

    customer: email,

    plan: plan.id,
  });

  redirect(checkoutData.checkoutUrl);
}
