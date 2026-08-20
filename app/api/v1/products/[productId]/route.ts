import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authenticateApiRequest } from "@/lib/developer-api/auth";
import {
  apiError,
  apiNotFound,
  apiUnauthorized,
} from "@/lib/developer-api/response";
import { normalizeInterval } from "@/lib/developer-api/webhooks";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    productId: string;
  }>;
}

/**
 * GET /v1/products/:product_id
 * Returns the product and its plans.
 * Accessible with a publishable or secret key.
 */
export async function GET(req: Request, { params }: RouteContext) {
  const context = await authenticateApiRequest(req, { allowPublishable: true });

  if (!context) {
    return apiUnauthorized();
  }

  const { productId } = await params;

  if (!productId) {
    return apiError("product_id is required.");
  }

  const { data: product, error } = await supabaseAdmin
    .from("products")
    .select(
      `
        id,
        name,
        slug,
        description,
        brand_color,
        is_active,
        plans (
          id,
          name,
          description,
          features,
          amount,
          currency,
          billing_interval,
          is_active
        )
      `,
    )
    .eq("id", productId)
    .eq("organisation_id", context.organisationId)
    .single();

  if (error || !product) {
    return apiNotFound("Product");
  }

  if (!product.is_active) {
    return apiError("This product is inactive.", 400);
  }

  return NextResponse.json({
    id: product.id,
    name: product.name,
    slug: product.slug,
    description: product.description,
    brand_color: product.brand_color,
    plans: (product.plans ?? [])
      .filter((plan) => plan.is_active)
      .map((plan) => ({
        id: plan.id,
        name: plan.name,
        description: plan.description,
        features: plan.features ?? [],
        amount: Number(plan.amount),
        currency: plan.currency ?? "NGN",
        interval: normalizeInterval(plan.billing_interval),
      })),
  });
}