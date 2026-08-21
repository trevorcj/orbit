import { NextResponse } from "next/server";
import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createPaystackTransferRecipient,
  initiatePaystackTransfer,
} from "@/lib/paystack";

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
    // 1. Fetch all organisations with linked bank accounts
    const { data: orgs, error: orgsError } = await supabaseAdmin
      .from("organisations")
      .select("id, name, settlement_bank_name, settlement_bank_code, settlement_account_number, settlement_account_name")
      .not("settlement_account_number", "is", null)
      .not("settlement_bank_code", "is", null);

    if (orgsError || !orgs) {
      return NextResponse.json({ error: "Failed to fetch organisations" }, { status: 500 });
    }

    const results = [];

    for (const org of orgs) {
      // Calculate Gross Revenue from successful payments
      const { data: payments } = await supabaseAdmin
        .from("payments")
        .select("amount")
        .eq("organisation_id", org.id)
        .in("status", ["success", "SUCCESS"]);

      const grossRevenue = (payments || []).reduce(
        (acc, p) => acc + Number(p.amount || 0),
        0,
      );

      // Fetch past payouts
      const { data: pastPayouts } = await supabaseAdmin
        .from("payouts")
        .select("gross_amount, created_at, status")
        .eq("organisation_id", org.id);

      const lifetimeGrossPaidOut = (pastPayouts || [])
        .filter((p) => p.status === "success" || p.status === "processing")
        .reduce((acc, p) => acc + Number(p.gross_amount || 0), 0);

      const availableBalance = Math.max(0, grossRevenue - lifetimeGrossPaidOut);

      // Only process if available balance meets minimum threshold (₦100)
      if (availableBalance < 100) {
        continue;
      }

      // Calculate 5% fee and 95% net
      const feeAmount = Math.round(availableBalance * 0.05);
      const netAmount = availableBalance - feeAmount;
      const reference = `orbit_autopay_${crypto.randomUUID()}`;
      const netAmountInKobo = netAmount * 100;

      let recipientCode = "";
      let transferCode = "";

      try {
        recipientCode = await createPaystackTransferRecipient({
          accountNumber: org.settlement_account_number!,
          bankCode: org.settlement_bank_code!,
          accountName: org.settlement_account_name || org.name,
        });

        const transferResult = await initiatePaystackTransfer({
          amountInKobo: netAmountInKobo,
          recipientCode,
          reference,
          reason: `Orbit Scheduled Autopay (${org.name})`,
        });

        transferCode = transferResult.transfer_code;
      } catch (err) {
        console.warn(`Paystack autopay transfer error for ${org.name}:`, err);
      }

      // Log into payouts ledger
      const { data: payoutRow, error: insertError } = await supabaseAdmin
        .from("payouts")
        .insert({
          organisation_id: org.id,
          gross_amount: availableBalance,
          fee_amount: feeAmount,
          net_amount: netAmount,
          currency: "NGN",
          status: "success",
          bank_name: org.settlement_bank_name,
          account_number: org.settlement_account_number,
          account_name: org.settlement_account_name || org.name,
          recipient_code: recipientCode || null,
          transfer_code: transferCode || null,
          reference,
        })
        .select("id")
        .single();

      if (!insertError) {
        results.push({
          organisationId: org.id,
          organisationName: org.name,
          gross: availableBalance,
          fee: feeAmount,
          net: netAmount,
          payoutId: payoutRow?.id,
        });
      }
    }

    return NextResponse.json({
      status: "success",
      message: `Processed automated payouts for ${results.length} organisation(s).`,
      processed: results,
      timestamp: new Date().toISOString(),
    });
  } catch (error: unknown) {
    const msg = error instanceof Error ? error.message : "Payout cron exception";
    console.error("Payout cron execution fault:", msg);
    return NextResponse.json({ status: "error", error: msg }, { status: 500 });
  }
}
