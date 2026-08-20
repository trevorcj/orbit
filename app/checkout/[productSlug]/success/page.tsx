import { Check, XCircle, ArrowRight } from "lucide-react";
import Link from "next/link";
import { verifyPaystackTransaction, VerifiedTransactionData } from "@/lib/paystack";
import { supabaseAdmin } from "@/lib/supabase-admin";
import { fulfillPayment } from "@/lib/payments/fulfill-payment";
import Image from "next/image";

interface SuccessPageProps {
  params: Promise<{
    productSlug: string;
  }>;
  searchParams: Promise<{
    reference?: string;
    trxref?: string;
    orderReference?: string;
  }>;
}

export default async function CheckoutSuccessPage({
  params,
  searchParams,
}: SuccessPageProps) {
  const { productSlug } = await params;
  const sParams = await searchParams;

  const orderRef = sParams.reference ?? sParams.trxref ?? sParams.orderReference;

  if (!orderRef) {
    return (
      <PaymentErrorView
        error="No payment reference returned. If your account was charged, please contact support."
      />
    );
  }

  let verificationResult: VerifiedTransactionData | null = null;
  let portalToken: string | null = null;
  let planName = "Subscription";

  try {
    /*
     * 1. Verify payment directly with Paystack API
     */
    verificationResult = await verifyPaystackTransaction(orderRef);

    if (
      verificationResult.status !== "success" &&
      verificationResult.status !== "SUCCESS"
    ) {
      throw new Error(
        verificationResult.gateway_response || "Payment verification was unsuccessful.",
      );
    }

    /*
     * 2. Find tracking order record
     */
    const { data: paymentOrder, error: orderError } = await supabaseAdmin
      .from("payment_orders")
      .select(
        `
        plan_id,
        product_id,
        customer_email,
        customer_first_name,
        customer_last_name,
        plans (
          name,
          trial_period_days
        )
      `,
      )
      .eq("order_reference", orderRef)
      .maybeSingle();

    if (orderError) {
      console.error("Order lookup error:", orderError);
    }

    const planId =
      paymentOrder?.plan_id ||
      (verificationResult.metadata?.planId as string) ||
      "";

    if (paymentOrder?.plans) {
      const planObj = paymentOrder.plans as unknown as { name?: string };
      if (planObj?.name) planName = planObj.name;
    }

    /*
     * 3. Fulfill Payment & Create Subscription
     */
    const fulfillment = await fulfillPayment({
      orderReference: orderRef,
      planId,
      transaction: {
        amount: verificationResult.amount / 100, // Convert Kobo to Naira
        email:
          verificationResult.customer?.email ??
          paymentOrder?.customer_email,
        customerName:
          `${verificationResult.customer?.first_name || ""} ${
            verificationResult.customer?.last_name || ""
          }`.trim() || undefined,
        cardToken: verificationResult.authorization?.authorization_code ?? null,
        cardBrand: verificationResult.authorization?.card_type ?? null,
        cardLast4: verificationResult.authorization?.last4 ?? null,
        cardExpiry:
          verificationResult.authorization?.exp_month &&
          verificationResult.authorization?.exp_year
            ? `${verificationResult.authorization.exp_month}/${verificationResult.authorization.exp_year}`
            : null,
        providerCustomerId:
          verificationResult.customer?.customer_code ?? null,
      },
    });

    portalToken = fulfillment.portalToken || null;
  } catch (error) {
    console.error("Checkout fulfillment failed:", error);

    // If verification succeeded on Paystack but database had a transient error, show pending state
    if (verificationResult?.status === "success") {
      return (
        <PaymentPendingView message="Your payment was confirmed by Paystack. We are currently finalizing your subscription setup. You will receive a confirmation email shortly." />
      );
    }

    return (
      <PaymentErrorView
        error={
          error instanceof Error ? error.message : "Payment verification failed"
        }
      />
    );
  }

  return (
    <div className="min-h-screen bg-white text-zinc-900 flex flex-col justify-between items-center py-12 px-6 antialiased font-sans">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mt-4">
        <Image
          src="/orbit-light.svg"
          alt="Orbit"
          width={90}
          height={22}
          className="w-auto h-5"
          priority
        />
      </div>

      {/* Main Success Container */}
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6 my-auto">
        <div className="h-14 w-14 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-600">
          <Check size={26} strokeWidth={2.5} />
        </div>

        <div className="space-y-1.5">
          <h1 className="text-2xl font-bold tracking-tight text-zinc-950">
            Subscription activated
          </h1>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto leading-relaxed">
            Your payment was confirmed by Paystack. Your access to{" "}
            <strong className="text-zinc-900">{planName}</strong> is now live.
          </p>
        </div>

        {/* Order Details Card with Slim Border */}
        <div className="w-full bg-zinc-50/70 rounded-lg border border-zinc-200 p-5 text-left space-y-3 text-xs">
          <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200/60">
            <span className="text-zinc-500 font-medium">Status</span>
            <span className="inline-flex items-center gap-1.5 font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded-full text-[11px] border border-emerald-200">
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Active
            </span>
          </div>

          <div className="flex justify-between items-center pb-2.5 border-b border-zinc-200/60">
            <span className="text-zinc-500 font-medium">Payment provider</span>
            <span className="font-semibold text-zinc-800">Paystack</span>
          </div>

          <div className="flex justify-between items-center">
            <span className="text-zinc-500 font-medium">Reference</span>
            <code className="font-mono text-zinc-600 bg-white px-2 py-0.5 rounded border border-zinc-200 text-[11px] max-w-44 truncate">
              {orderRef}
            </code>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="w-full space-y-3 pt-2">
          {portalToken ? (
            <Link
              href={`/portal/${portalToken}`}
              className="w-full h-11 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <span>Go to Customer Portal</span>
              <ArrowRight size={14} />
            </Link>
          ) : (
            <Link
              href={`/checkout/${productSlug}`}
              className="w-full h-11 rounded-lg bg-zinc-900 hover:bg-zinc-800 text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
              <span>Return to Checkout</span>
            </Link>
          )}

          <p className="text-[11px] text-zinc-400">
            A confirmation receipt has been sent to your email address.
          </p>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-zinc-400 pt-6 flex items-center gap-1">
        <span>Powered by Orbit Financial Infrastructure</span>
      </div>
    </div>
  );
}

function PaymentErrorView({ error }: { error: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6 antialiased font-sans">
      <div className="h-14 w-14 rounded-full bg-rose-50 border border-rose-200 flex items-center justify-center text-rose-600 mb-4">
        <XCircle size={26} />
      </div>

      <h1 className="text-xl font-bold text-zinc-900">Verification Failed</h1>
      <p className="mt-1.5 text-xs text-zinc-500 text-center max-w-md leading-relaxed">
        {error}
      </p>

      <a
        href="javascript:history.back()"
        className="mt-5 inline-flex items-center gap-1.5 text-xs font-semibold text-[#0F86EE] hover:underline">
        Try Again
      </a>
    </div>
  );
}

function PaymentPendingView({ message }: { message: string }) {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-center items-center px-6 antialiased font-sans">
      <div className="h-14 w-14 rounded-full bg-blue-50 border border-blue-200 flex items-center justify-center text-[#0F86EE] mb-4">
        <div className="h-6 w-6 border-2 border-[#0F86EE] border-t-transparent rounded-full animate-spin" />
      </div>

      <h1 className="text-xl font-bold text-zinc-900">Activating Subscription</h1>
      <p className="mt-1.5 text-xs text-zinc-500 text-center max-w-md leading-relaxed">
        {message}
      </p>
    </div>
  );
}
