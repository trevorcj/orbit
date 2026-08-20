import { NextResponse } from "next/server";

export async function GET() {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL || "https://orbit-billing-nomba.vercel.app";

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
