import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authenticateApiRequest } from "@/lib/developer-api/auth";
import {
  apiError,
  apiUnauthorized,
  apiForbidden,
} from "@/lib/developer-api/response";

export const dynamic = "force-dynamic";

interface CreateCheckoutSessionRequest {
  plan_id?: string;
  customer?: {
    email?: string;
    name?: string;
  };
  success_url?: string;
  cancel_url?: string;
}

export async function POST(req: Request) {
  const context = await authenticateApiRequest(req);

  if (!context) {
    return apiUnauthorized();
  }

  if (context.keyType === "publishable") {
    return apiForbidden();
  }

  let body: CreateCheckoutSessionRequest;

  try {
    body = await req.json();
  } catch {
    return apiError("Request body must be valid JSON.");
  }

  const planId = body.plan_id;
  const email = (body.customer?.email ?? "").trim().toLowerCase();
  const customerName = (body.customer?.name ?? "").trim();
  const successUrl = body.success_url;
  const cancelUrl = body.cancel_url;

  if (!planId) {
    return apiError("plan_id is required.");
  }

  if (!email || !email.includes("@")) {
    return apiError("A valid customer email is required.");
  }

  if (successUrl && !isValidHttpUrl(successUrl)) {
    return apiError("success_url must be a valid http(s) URL.");
  }

  if (cancelUrl && !isValidHttpUrl(cancelUrl)) {
    return apiError("cancel_url must be a valid http(s) URL.");
  }

  /*
   * 1. Verify the plan belongs to the authenticated organisation
   */
  const { data: plan, error: planError } = await supabaseAdmin
    .from("plans")
    .select(
      `
        id,
        amount,
        product_id,
        is_active,
        products!plans_product_id_fkey (
          id,
          slug,
          is_active
        )
      `,
    )
    .eq("id", planId)
    .eq("organisation_id", context.organisationId)
    .single();

  if (planError || !plan) {
    return apiError("Plan could not be verified.", 404);
  }

  if (!plan.is_active) {
    return apiError("This plan is unavailable.", 400);
  }

  const product = plan.products as unknown as {
    id: string;
    slug: string;
    is_active: boolean;
  };

  if (!product || !product.is_active) {
    return apiError("The plan's product is unavailable.", 400);
  }

  /*
   * 2. Generate tracking order reference & hosted checkout URL
   */
  const appUrl = process.env.NEXT_PUBLIC_APP_URL ?? "https://orbit-billing-nomba.vercel.app";
  const orderReference = `orbit_ord_${crypto.randomUUID()}`;

  const [firstName, ...lastNameParts] = customerName
    ? customerName.split(/\s+/)
    : [];

  const { error: paymentOrderError } = await supabaseAdmin
    .from("payment_orders")
    .insert({
      order_reference: orderReference,
      plan_id: plan.id,
      product_id: plan.product_id,
      customer_email: email,
      customer_first_name: firstName || "Customer",
      customer_last_name: lastNameParts.join(" ") || "User",
      status: "pending",
    });

  if (paymentOrderError) {
    console.error("API CHECKOUT ORDER CREATE FAILED:", paymentOrderError);
    return apiError("Could not create payment record.", 500);
  }

  const hostedUrl = new URL(`/checkout/${product.slug}`, appUrl);
  hostedUrl.searchParams.set("plan", plan.id);

  if (email) {
    hostedUrl.searchParams.set("email", email);
  }

  if (customerName) {
    hostedUrl.searchParams.set("name", customerName);
  }

  if (successUrl) {
    hostedUrl.searchParams.set("return_url", successUrl);
  }

  if (cancelUrl) {
    hostedUrl.searchParams.set("cancel_url", cancelUrl);
  }

  return NextResponse.json(
    {
      id: `cs_${orderReference}`,
      url: hostedUrl.toString(),
    },
    { status: 201 },
  );
}

function isValidHttpUrl(value: string): boolean {
  try {
    const url = new URL(value);
    return url.protocol === "http:" || url.protocol === "https:";
  } catch {
    return false;
  }
}