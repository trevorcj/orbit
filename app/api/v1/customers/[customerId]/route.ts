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
 * Supports querying by either customer UUID or customer email.
 */
export async function GET(req: Request, { params }: RouteContext) {
  const context = await authenticateApiRequest(req);

  if (!context) {
    return apiUnauthorized();
  }

  if (context.keyType === "publishable") {
    return apiForbidden();
  }

  const { customerId: rawIdentifier } = await params;

  if (!rawIdentifier) {
    return apiError("customer_id or email is required.");
  }

  const identifier = decodeURIComponent(rawIdentifier).trim().toLowerCase();
  const isEmail = identifier.includes("@");

  let customerQuery = supabaseAdmin
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
    .eq("organisation_id", context.organisationId);

  if (isEmail) {
    customerQuery = customerQuery.eq("email", identifier);
  } else {
    customerQuery = customerQuery.eq("id", identifier);
  }

  const { data: customer, error } = await customerQuery.maybeSingle();

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