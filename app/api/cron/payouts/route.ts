import { NextResponse } from "next/server";
import { processAutomatedPayouts } from "@/lib/cron/payouts";

export const dynamic = "force-dynamic";

function checkAuth(req: Request): boolean {
  const secret = process.env.BILLING_CRON_SECRET || process.env.CRON_SECRET;
  if (!secret) return true;

  const authHeader = req.headers.get("authorization");
  const url = new URL(req.url);
  const rawQuerySecret = url.searchParams.get("secret");

  if (authHeader) {
    const cleanHeader = authHeader.replace(/^Bearer\s+/i, "").trim();
    if (cleanHeader === secret || cleanHeader.replace(/ /g, "+") === secret) {
      return true;
    }
  }

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
    return NextResponse.json({ error: "Unauthorized cron request" }, { status: 401 });
  }

  try {
    const results = await processAutomatedPayouts();
    return NextResponse.json({
      status: "success",
      message: `Processed automated payouts for ${results.processedCount} organisation(s).`,
      metrics: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Payout cron exception";
    console.error("Payout cron execution fault:", msg);
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}

export async function POST(req: Request): Promise<NextResponse> {
  return GET(req);
}
