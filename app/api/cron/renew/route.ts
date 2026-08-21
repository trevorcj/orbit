import { NextResponse } from "next/server";
import { processBackgroundRenewals } from "@/lib/cron/renew";
import { processAutomatedPayouts } from "@/lib/cron/payouts";

export const dynamic = "force-dynamic";

function checkAuth(req: Request): boolean {
  const secret = process.env.BILLING_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return true; // Allowed if no secret configured

  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const rawQuerySecret = url.searchParams.get("secret");

  // Check Bearer header
  if (authHeader) {
    const cleanHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (cleanHeader === secret || cleanHeader.replace(/ /g, "+") === secret) {
      return true;
    }
  }

  // Check query parameter
  if (rawQuerySecret) {
    const normalizedQuery = rawQuerySecret.replace(/ /g, "+");
    if (
      rawQuerySecret === secret ||
      normalizedQuery === secret ||
      decodeURIComponent(rawQuerySecret) === secret
    ) {
      return true;
    }
  }

  return false;
}

export async function GET(req: Request): Promise<NextResponse> {
  if (!checkAuth(req)) {
    console.warn("⚠️ Unauthorized cron request attempt");
    return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
  }

  try {
    // 1. Process all due subscription renewals
    const renewalMetrics = await processBackgroundRenewals();

    // 2. Process all scheduled organization payouts
    const payoutMetrics = await processAutomatedPayouts();

    return NextResponse.json({
      status: "success",
      message: "Orbit unified background cron executed successfully.",
      renewals: renewalMetrics,
      payouts: payoutMetrics,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const errorString =
      error instanceof Error ? error.message : "Internal system runtime exception";
    console.error("Cron execution fault:", errorString);
    return NextResponse.json(
      {
        status: "error",
        message: "Internal background engine processing fault.",
        details: errorString,
      },
      { status: 500 },
    );
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  return GET(req);
}
