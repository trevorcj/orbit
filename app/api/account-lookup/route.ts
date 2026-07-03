import { NextResponse } from "next/server";

import { lookupAccount } from "@/lib/nomba";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    console.log("Account lookup request:", body);

    const data = await lookupAccount(body.accountNumber, body.bankCode);
    console.log("Account lookup response data:", data);

    return NextResponse.json({
      accountName: data.accountName || data.account_name || "",
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Account lookup failed";
    console.error("Account lookup route error:", message, error);
    return NextResponse.json(
      {
        message,
        error: error instanceof Error ? error.toString() : String(error),
      },
      { status: 400 },
    );
  }
}
