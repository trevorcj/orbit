import crypto from "crypto";
import { supabaseAdmin } from "@/lib/supabase-admin";
import {
  createPaystackTransferRecipient,
  initiatePaystackTransfer,
} from "@/lib/paystack";

export interface ProcessPayoutsResult {
  processedCount: number;
  results: Array<{
    organisationId: string;
    organisationName: string;
    gross: number;
    fee: number;
    net: number;
    payoutId?: string;
  }>;
}

export async function processAutomatedPayouts(): Promise<ProcessPayoutsResult> {
  const { data: orgs, error: orgsError } = await supabaseAdmin
    .from("organisations")
    .select(
      "id, name, settlement_bank_name, settlement_bank_code, settlement_account_number, settlement_account_name",
    )
    .not("settlement_account_number", "is", null)
    .not("settlement_bank_code", "is", null);

  if (orgsError || !orgs) {
    console.error("Payout Cron: Failed to fetch organisations:", orgsError);
    return { processedCount: 0, results: [] };
  }

  const results = [];

  for (const org of orgs) {
    // 1. Calculate gross revenue
    const { data: payments } = await supabaseAdmin
      .from("payments")
      .select("amount")
      .eq("organisation_id", org.id)
      .in("status", ["success", "SUCCESS"]);

    const grossRevenue = (payments || []).reduce(
      (acc, p) => acc + Number(p.amount || 0),
      0,
    );

    // 2. Calculate past payouts
    const { data: pastPayouts } = await supabaseAdmin
      .from("payouts")
      .select("gross_amount, created_at, status")
      .eq("organisation_id", org.id);

    const lifetimeGrossPaidOut = (pastPayouts || [])
      .filter((p) => p.status === "success" || p.status === "processing")
      .reduce((acc, p) => acc + Number(p.gross_amount || 0), 0);

    const availableBalance = Math.max(0, grossRevenue - lifetimeGrossPaidOut);

    // Only process if balance >= 100 NGN
    if (availableBalance < 100) {
      continue;
    }

    const feeAmount = Math.round(availableBalance * 0.05); // 5% Orbit Cut
    const netAmount = availableBalance - feeAmount; // 95% sent to merchant
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

    // Persist to payouts ledger
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

  return {
    processedCount: results.length,
    results,
  };
}
