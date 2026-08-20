import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authenticateApiRequest } from "@/lib/developer-api/auth";
import { apiUnauthorized } from "@/lib/developer-api/response";
import { normalizeInterval } from "@/lib/developer-api/webhooks";

export const dynamic = "force-dynamic";

/**
 * GET /v1/plans
 * Returns the plans the authenticated organisation has created.
 * Accessible with a publishable or secret key.
 */
export async function GET(req: Request) {
  const context = await authenticateApiRequest(req, { allowPublishable: true });

  if (!context) {
    return apiUnauthorized();
  }

  const { data: plans, error } = await supabaseAdmin
    .from("plans")
    .select(
      `
        id,
        name,
        description,
        features,
        amount,
        currency,
        billing_interval,
        is_active,
        product_id,
        products (
          id,
          name,
          slug
        )
      `,
    )
    .eq("organisation_id", context.organisationId)
    .eq("is_active", true)
    .order("amount", { ascending: true });

  if (error) {
    console.error("API PLANS FETCH FAILED:", error);
    return NextResponse.json(
      { error: { message: "Unable to fetch plans." } },
      { status: 500 },
    );
  }

  return NextResponse.json({
    data: (plans ?? []).map((plan) => {
      const product = plan.products as unknown as {
        id: string;
        name: string;
        slug: string;
      } | null;

      return {
        id: plan.id,
        name: plan.name,
        amount: Number(plan.amount),
        currency: plan.currency ?? "NGN",
        interval: normalizeInterval(plan.billing_interval),
        description: plan.description,
        features: plan.features ?? [],
        product_id: plan.product_id,
        product: product
          ? {
              id: product.id,
              name: product.name,
              slug: product.slug,
            }
          : null,
      };
    }),
  });
}