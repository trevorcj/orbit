import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { authenticateApiRequest } from "@/lib/developer-api/auth";
import {
  apiError,
  apiForbidden,
  apiNotFound,
  apiUnauthorized,
} from "@/lib/developer-api/response";

export const dynamic = "force-dynamic";

interface RouteContext {
  params: Promise<{
    customerId: string;
  }>;
}

/**
 * GET /v1/customers/:customer_id
 * Returns the customer's Orbit information.
 */
export async function GET(req: Request, { params }: RouteContext) {
  const context = await authenticateApiRequest(req);

  if (!context) {
    return apiUnauthorized();
  }

  if (context.keyType === "publishable") {
    return apiForbidden();
  }

  const { customerId } = await params;

  if (!customerId) {
    return apiError("customer_id is required.");
  }

  const { data: customer, error } = await supabaseAdmin
    .from("customers")
    .select(
      `
        id,
        email,
        first_name,
        last_name,
        phone,
        created_at
      `,
    )
    .eq("id", customerId)
    .eq("organisation_id", context.organisationId)
    .single();

  if (error || !customer) {
    return apiNotFound("Customer");
  }

  return NextResponse.json({
    id: customer.id,
    email: customer.email,
    name: [customer.first_name, customer.last_name]
      .filter(Boolean)
      .join(" "),
    phone: customer.phone,
    created_at: customer.created_at,
  });
}