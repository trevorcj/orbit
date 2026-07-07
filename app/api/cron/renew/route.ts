import { NextResponse } from "next/server";
import { processBackgroundRenewals } from "@/lib/cron/renew";

export const dynamic = "force-dynamic";

export async function GET(): Promise<NextResponse> {
  try {
    const outputMetrics = await processBackgroundRenewals();
    return NextResponse.json({
      status: "success",
      message:
        "Orbit background recurring subscription scanner executed successfully.",
      metrics: outputMetrics,
    });
  } catch (error: unknown) {
    const errorString =
      error instanceof Error
        ? error.message
        : "Internal system runtime exception";
    return NextResponse.json(
      {
        status: "error",
        message: "Internal recurring engine processing fault.",
        details: errorString,
      },
      { status: 500 },
    );
  }
}
