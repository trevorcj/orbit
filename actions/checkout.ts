"use server";

import crypto from "crypto";
import { initializePaystackTransaction } from "@/lib/paystack";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { redirect } from "next/navigation";

export async function initiateSubscriptionPayment(formData: FormData) {
  const planId = String(formData.get("planId") || "");
  const productId = String(formData.get("productId") || "");
  const email = String(formData.get("email") || "").trim().toLowerCase();
  const firstName = String(formData.get("firstName") || "").trim();
  const lastName = String(formData.get("lastName") || "").trim();

  const returnUrl = String(formData.get("returnUrl") || "").trim();
  const cancelUrl = String(formData.get("cancelUrl") || "").trim();

  if (!planId || !productId || !email || !firstName || !lastName) {
    throw new Error("Please complete all required details.");
  }

  if (!email.includes("@")) {
    throw new Error("Please enter a valid email address.");
  }

  const supabase = supabaseAdmin;

  /*
   * 1. Verify plan and product
   */
  const { data: plan, error: planError } = await supabase
    .from("plans")
    .select(
      `
      id,
      name,
      amount,
      currency,
      trial_period_days,
      billing_interval,
      product_id,
      organisation_id,
      is_active,
      products!plans_product_id_fkey (
        id,
        name,
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
    throw new Error("This plan is currently unavailable.");
  }

  const product = plan.products as unknown as {
    id: string;
    name: string;
    slug: string;
    is_active: boolean;
  };

  if (!product || product.id !== productId) {
    throw new Error("Invalid product selection.");
  }

  if (!product.is_active) {
    throw new Error("This product is currently unavailable.");
  }

  /*
   * 2. Determine trial status and charge amount (convert Naira to Kobo for Paystack)
   */
  const trialDays = Number(plan.trial_period_days || 0);
  const isTrial = trialDays > 0;
  
  // Paystack expects amount in KOBO (100 Naira = 10,000 Kobo).
  // For trial plans, we charge a nominal ₦100 (10,000 kobo) to tokenize the card.
  // For regular plans, charge full plan amount in kobo.
  const amountInNaira = isTrial ? 100 : Number(plan.amount);
  const amountInKobo = Math.round(amountInNaira * 100);

  const orderReference = `orbit_ord_${crypto.randomUUID()}`;
  const appUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  
  const callbackUrl = new URL(`/checkout/${product.slug}/success`, appUrl);
  if (returnUrl) {
    callbackUrl.searchParams.set("return_url", returnUrl);
  }
  if (cancelUrl) {
    callbackUrl.searchParams.set("cancel_url", cancelUrl);
  }

  /*
   * 3. Fetch organisation Paystack Subaccount (if configured)
   */
  const { data: org } = await supabase
    .from("organisations")
    .select("paystack_subaccount_code")
    .eq("id", plan.organisation_id)
    .maybeSingle();

  const subaccountCode = org?.paystack_subaccount_code || undefined;

  /*
   * 4. Initialize Paystack Transaction in Kobo (with automatic 95/5 split)
   */
  const checkoutData = await initializePaystackTransaction({
    email,
    amount: amountInKobo,
    callbackUrl: callbackUrl.toString(),
    reference: orderReference,
    channels: ["card"],
    subaccount: subaccountCode,
    metadata: {
      orderReference,
      planId: plan.id,
      productId: plan.product_id,
      organisationId: plan.organisation_id,
      customerEmail: email,
      customerFirstName: firstName,
      customerLastName: lastName,
      isTrial,
      trialPeriodDays: trialDays,
      returnUrl: returnUrl || undefined,
      cancelUrl: cancelUrl || undefined,
      custom_fields: [
        {
          display_name: "Customer Name",
          variable_name: "customer_name",
          value: `${firstName} ${lastName}`.trim(),
        },
        {
          display_name: "Product & Plan",
          variable_name: "product_plan",
          value: `${product.name} - ${plan.name}`,
        },
      ],
    },
  });

  if (!checkoutData.data?.authorization_url) {
    throw new Error("Unable to initialize Paystack checkout.");
  }

  /*
   * 5. Save pending payment order tracking record
   */
  const { error: paymentOrderError } = await supabase
    .from("payment_orders")
    .insert({
      order_reference: orderReference,
      plan_id: plan.id,
      product_id: plan.product_id,
      customer_email: email,
      customer_first_name: firstName,
      customer_last_name: lastName,
      status: "pending",
    });

  if (paymentOrderError) {
    console.error("PAYMENT ORDER CREATE FAILED:", paymentOrderError);
    throw new Error("Could not create checkout tracking record.");
  }

  console.log("PAYSTACK CHECKOUT INITIALIZED", {
    reference: orderReference,
    customer: email,
    plan: plan.id,
    amountInNaira,
    amountInKobo,
    isTrial,
  });

  redirect(checkoutData.data.authorization_url);
}
