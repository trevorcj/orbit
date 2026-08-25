import { NextResponse } from "next/server";
import { getAppUrl } from "@/lib/url";

export async function GET(req: Request) {
  const appUrl = getAppUrl(req);

  return NextResponse.json({
    name: "Orbit Developer API",
    version: "v1",
    documentation_url: `${appUrl}/docs`,
    endpoints: {
      checkout_sessions: `${appUrl}/api/v1/checkout/sessions`,
      plans: `${appUrl}/api/v1/plans`,
      products: `${appUrl}/api/v1/products/:product_id`,
      customers: `${appUrl}/api/v1/customers/:customer_id`,
      customer_subscription: `${appUrl}/api/v1/customers/:customer_id/subscription`,
      subscriptions: `${appUrl}/api/v1/subscriptions/:subscription_id`,
      cancel_subscription: `${appUrl}/api/v1/subscriptions/:subscription_id/cancel`,
    },
  });
}
