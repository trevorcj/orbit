import { NextResponse } from "next/server";
import { resolvePaystackAccount } from "@/lib/paystack";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { accountNumber, bankCode } = body;

    if (!accountNumber || !bankCode) {
      return NextResponse.json(
        { message: "Account number and bank code are required." },
        { status: 400 },
      );
    }

    if (accountNumber.trim().length !== 10) {
      return NextResponse.json(
        { message: "Account number must be exactly 10 digits." },
        { status: 400 },
      );
    }

    const data = await resolvePaystackAccount(accountNumber, bankCode);

    return NextResponse.json({
      success: true,
      accountNumber: data.account_number,
      accountName: data.account_name,
    });
  } catch (error) {
    const message =
      error instanceof Error ? error.message : "Unable to verify bank account";
    console.error("Paystack account lookup error:", message);
    return NextResponse.json(
      {
        success: false,
        message,
      },
      { status: 400 },
    );
  }
}
