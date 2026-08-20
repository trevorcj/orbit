import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { subscriptionId } = body;

    if (!subscriptionId) {
      return NextResponse.json(
        { success: false, error: "Subscription ID required" },
        { status: 400 },
      );
    }

    const { error } = await supabaseAdmin
      .from("subscriptions")
      .update({
        cancel_at_period_end: false,
        cancelled_at: null,
        ends_at: null,
        status: "ACTIVE",
        updated_at: new Date().toISOString(),
      })
      .eq("id", subscriptionId);

    if (error) {
      return NextResponse.json(
        { success: false, error: error.message },
        { status: 500 },
      );
    }

    return NextResponse.json({
      success: true,
      message: "Subscription successfully reactivated!",
    });
  } catch (err) {
    console.error("Reactivation error:", err);
    return NextResponse.json(
      { success: false, error: "Internal server error" },
      { status: 500 },
    );
  }
}
