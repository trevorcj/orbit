import { Check, XCircle } from "lucide-react";
import { getAccessToken } from "@/lib/nomba";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fulfillPayment } from "@/lib/payments/fulfill-payment";

interface SuccessPageProps {
  searchParams: Promise<{
    reference?: string;
    orderReference?: string;
    orderId?: string;
  }>;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: SuccessPageProps) {
  const params = await searchParams;

  const orderRef = params.orderReference ?? params.reference ?? params.orderId;

  if (!orderRef) {
    return (
      <PaymentErrorView error="No order reference was returned from Nomba." />
    );
  }

  let verificationResult = null;

  try {
    /*
     * Verify payment directly with Nomba
     */

    const token = await getAccessToken();

    const url = new URL(
      "https://api.nomba.com/v1/transactions/accounts/single",
    );

    url.searchParams.set("orderReference", orderRef);

    const response = await fetch(url.toString(), {
      method: "GET",

      headers: {
        Authorization: `Bearer ${token}`,

        accountId: process.env.NOMBA_PARENT_ACCOUNT_ID!,
      },

      cache: "no-store",
    });

    const result = await response.json();

    console.log("NOMBA VERIFY:", JSON.stringify(result, null, 2));

    verificationResult = result;

    if (!response.ok || result?.code !== "00") {
      throw new Error(result?.description ?? "Unable to verify payment.");
    }

    /*
     * Fulfill successful payment
     */

    if (result?.data?.status === "SUCCESS") {
      const { data: paymentOrder, error } = await supabaseAdmin
        .from("payment_orders")
        .select(
          `
          plan_id,
          product_id,
          customer_email,
          customer_first_name,
          customer_last_name
        `,
        )
        .eq("order_reference", orderRef)
        .single();

      if (error || !paymentOrder) {
        console.error("Payment order lookup failed:", error);
        throw new Error("Payment order does not exist");
      }

      await fulfillPayment({
        orderReference: orderRef,
        planId: paymentOrder.plan_id,
        transaction: {
          amount: result.data.amount, // Comes down as "100.0" from Nomba log
          email:
            result.data.onlineCheckoutCustomerEmail ??
            paymentOrder.customer_email,
          customerName: result.data.senderName ?? "Nomba Customer",

          // 🔥 DYNAMIC REPAIR: Map the exact key Nomba returns in the successful payload!
          cardToken:
            result.data.onlineCheckoutTokenKey !== "N/A"
              ? result.data.onlineCheckoutTokenKey
              : null,

          cardBrand: result.data.onlineCheckoutCardType ?? "Card",
          cardLast4: result.data.onlineCheckoutCardPanLast4Digits ?? "0000",
          cardExpiry: null,
          providerCustomerId: result.data.userId ?? null,
        },
      });
    }
  } catch (error) {
    console.error("Payment verification failed:", error);

    return (
      <PaymentPendingView message="Your payment was received successfully. We're still activating your subscription. This usually takes less than a minute." />
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between items-center py-12 px-6">
      <div className="flex items-center gap-2 mt-6">
        <span className="text-[#0F86EE] font-black text-2xl">✕</span>

        <span className="font-bold text-xl">orbit</span>
      </div>

      <div className="max-w-md text-center flex flex-col items-center gap-5">
        <div className="h-14 w-14 rounded-full bg-[#E9F8EF] flex items-center justify-center text-[#1A7F3C]">
          <Check size={24} strokeWidth={3} />
        </div>

        <div>
          <h1 className="text-3xl font-bold">Payment Completed</h1>

          <p className="mt-3 text-zinc-500">
            Your payment was confirmed by Nomba.
          </p>

          <p className="mt-6 text-xs text-zinc-400">Order Reference</p>

          <code className="text-sm font-semibold break-all">{orderRef}</code>

          <p className="mt-6 text-xs text-zinc-400">Transaction Status</p>

          <p className="font-semibold text-emerald-600">
            ● {verificationResult?.data?.status ?? "SUCCESS"}
          </p>
        </div>
      </div>

      <div className="text-xs text-zinc-400">Your subscription is active.</div>
    </div>
  );
}

function PaymentErrorView({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6">
      <div className="h-14 w-14 rounded-full bg-rose-50 flex items-center justify-center text-rose-600">
        <XCircle size={24} />
      </div>

      <h1 className="mt-5 text-3xl font-bold">Verification Failed</h1>

      <p className="mt-3 text-zinc-500 text-center">{error}</p>
    </div>
  );
}

function PaymentPendingView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6">
      <div className="h-14 w-14 rounded-full bg-blue-50 flex items-center justify-center text-blue-600">
        <div className="h-6 w-6 border-2 border-blue-600 border-t-transparent rounded-full animate-spin" />
      </div>

      <h1 className="mt-5 text-3xl font-bold">Payment Received</h1>

      <p className="mt-3 text-zinc-500 text-center max-w-md">{message}</p>
    </div>
  );
}
