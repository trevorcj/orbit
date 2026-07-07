"use server";

import { createCheckoutOrder } from "@/lib/nomba";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";

export async function initiateSubscriptionPayment(formData: FormData) {
  const planId = formData.get("planId") as string;

  const productId = formData.get("productId") as string;

  const email = formData.get("email") as string;

  if (!planId || !productId || !email) {
    throw new Error("Missing required checkout details.");
  }

  const supabase = supabaseAdmin;

  /*
   * Get the plan from database.
   *
   * Never trust amount/product from frontend.
   */

  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      `
    id,
    amount,
    product_id,
    organisation_id,
    products!plans_product_id_fkey (
      slug
    )
    `,
    )
    .eq("id", planId)
    .single();

  console.log(typeof plan?.products, plan?.products);

  if (planError || !plan) {
    throw new Error("Plan could not be verified.");
  }

  /*
   * Create Nomba checkout session.
   *
   * We do NOT create customer,
   * subscription,
   * or payment here.
   *
   * Nothing is fulfilled until payment succeeds.
   */

  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000";

  console.log("PLAN:", JSON.stringify(plan, null, 2));

  const product = plan.products as unknown as { slug: string };

  const productSlug = product?.slug;

  if (!productSlug) {
    throw new Error("Product slug could not be resolved.");
  }

  const callbackUrl = `${appUrl}/checkout/${productSlug}/success`;

  const checkoutData = await createCheckoutOrder({
    amount: Number(plan.amount),
    customerEmail: email,
    callbackUrl,
    productId,
    planId,
  });

  const { error: paymentOrderError } = await supabase
    .from("payment_orders")
    .insert({
      order_reference: checkoutData.orderReference,
      plan_id: plan.id,
      product_id: plan.product_id,
      customer_email: email,
      status: "pending",
    });

  console.log("PAYMENT ORDER CREATED:", {
    orderReference: checkoutData.orderReference,
    error: paymentOrderError,
  });

  if (paymentOrderError) {
    console.error("Failed creating payment order record:", paymentOrderError);

    throw new Error("Could not create payment tracking record.");
  }

  if (!checkoutData.checkoutUrl) {
    console.error("Nomba checkout creation failed:", checkoutData);

    throw new Error("Could not create Nomba checkout session.");
  }

  console.log("Redirecting customer to Nomba:", checkoutData.checkoutUrl);

  console.log("FINAL CHECKOUT REDIRECT:", checkoutData.checkoutUrl);

  redirect(checkoutData.checkoutUrl);
}
