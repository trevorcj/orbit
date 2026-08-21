import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authenticateApiRequest } from "@/lib/developer-api/auth";
import { apiUnauthorized } from "@/lib/developer-api/response";
import { normalizeInterval } from "@/lib/developer-api/webhooks";

export const dynamic = "force-dynamic";

/**
 * GET /api/v1/products
 * Returns all active products and their attached plans for the authenticated organisation.
 * Accessible with either a publishable (pk_live_...) or secret (sk_live_...) key.
 */
export async function GET(req: Request) {
  const context = await authenticateApiRequest(req, { allowPublishable: true });

  if (!context) {
    return apiUnauthorized();
  }

  const { data: products, error } = await supabaseAdmin
    .from("products")
    .select(
      `
        id,
        name,
        slug,
        description,
        brand_color,
        is_active,
        created_at,
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
    .eq("organisation_id", context.organisationId)
    .eq("is_active", true)
    .order("created_at", { ascending: false });

  if (error) {
    console.error("API PRODUCTS FETCH FAILED:", error);
    return NextResponse.json(
      { error: { message: "Unable to fetch products." } },
      { status: 500 },
    );
  }

  const formatted = (products ?? []).map((product) => {
    const rawPlans = (product.plans ?? []) as Array<{
      id: string;
      name: string;
      description: string | null;
      features: string[] | null;
      amount: number;
      currency: string | null;
      billing_interval: string | null;
      is_active: boolean;
    }>;

    return {
      id: product.id,
      name: product.name,
      slug: product.slug,
      description: product.description,
      brand_color: product.brand_color,
      plans: rawPlans
        .filter((p) => p.is_active)
        .map((p) => ({
          id: p.id,
          name: p.name,
          description: p.description,
          features: p.features ?? [],
          amount: Number(p.amount),
          currency: p.currency ?? "NGN",
          interval: normalizeInterval(p.billing_interval),
        })),
    };
  });

  return NextResponse.json({
    data: formatted,
  });
}
