import { NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase-admin";

export async function POST(req: Request) {
  const body = await req.json();

  const { subscriptionId } = body;

  const { error } = await supabaseAdmin
    .from("subscriptions")
    .update({
      status: "CANCELLED",

      cancelled_at: new Date().toISOString(),

      ends_at: new Date().toISOString(),
    })
    .eq("id", subscriptionId);

  if (error) {
    return NextResponse.json(
      {
        success: false,
        error: error.message,
      },
      {
        status: 500,
      },
    );
  }

  return NextResponse.json({
    success: true,
  });
}
