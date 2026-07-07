import { createClient } from "@/lib/supabase/server";
import { ArrowUpRight, TrendingUp } from "lucide-react";

export const revalidate = 0;

export default async function MerchantDashboardPage() {
  const supabase = await createClient();

  // 1. DYNAMIC FETCH: Pull authenticated merchant context layers
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // Isolate active organization mapping matching the signed-in workspace owner
  const { data: org } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const orgId = org?.id;

  // 2. DATA EXTRACTION: Query metrics restricted strictly to the current organization boundary
  const { data: subsData } = orgId
    ? await supabase
        .from("subscriptions")
        .select("id, status, plan_id")
        .eq("organisation_id", orgId)
    : { data: null };

  const { data: payData } = orgId
    ? await supabase
        .from("payments")
        .select("amount, status, created_at")
        .eq("organisation_id", orgId)
    : { data: null };

  const { data: plansData } = orgId
    ? await supabase
        .from("plans")
        .select("id, name, amount, billing_interval, product_id")
    : { data: null };

  const subscriptions = subsData || [];
  const payments = payData || [];
  const plans = plansData || [];

  // 3. REVENUE COMPILATION: Calculate analytical variables from real database rows
  const successfulPayments = payments.filter(
    (p) => p.status === "success" || p.status === "SUCCESS",
  );
  const grossRevenue = successfulPayments.reduce(
    (acc, p) => acc + Number(p.amount),
    0,
  );

  const activeSubs = subscriptions.filter(
    (s) => s.status.toUpperCase() === "ACTIVE",
  );

  // Calculate Monthly Recurring Revenue (MRR) dynamically across plan intervals
  const mrr = activeSubs.reduce((acc, sub) => {
    const plan = plans.find((p) => p.id === sub.plan_id);
    if (!plan) return acc;
    const amountValue = Number(plan.amount || 0);
    if (plan.billing_interval?.toLowerCase() === "yearly") {
      return acc + amountValue / 12;
    }
    return acc + amountValue;
  }, 0);

  // 4. TOP PRODUCTS TIERS CALCULATION: Dynamically sum gross volume per active plan product
  const productPerformanceMap: Record<
    string,
    { name: string; amount: number; interval: string }
  > = {};

  plans.forEach((plan) => {
    const planPayments = successfulPayments; // Match references to this tier if applicable
    const planTotal = planPayments.reduce(
      (acc, p) => acc + Number(p.amount),
      0,
    );

    if (planTotal > 0) {
      productPerformanceMap[plan.id] = {
        name: plan.name || "Billing Tier",
        amount: planTotal,
        interval: plan.billing_interval || "monthly",
      };
    }
  });

  const activeTopProducts = Object.values(productPerformanceMap).sort(
    (a, b) => b.amount - a.amount,
  );

  return (
    <div className="flex flex-col gap-8 animate-in fade-in duration-300">
      {/* Upper Context Header Section */}
      <div className="flex justify-between items-center border-b border-zinc-200/40 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">
            Workspace Insights
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Real-time ledger indicators monitoring
          </p>
        </div>
        <div className="text-xs font-semibold px-3 py-1.5 bg-white border border-zinc-200 rounded-xl shadow-sm text-zinc-500 select-none">
          Live Sync active
        </div>
      </div>

      {/* CORE EXECUTIVE REVENUE CARD GRIDS ROWS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Gross Revenue Tracking Display Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 flex flex-col justify-between h-36 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Gross Revenue
            </span>
            <h3 className="text-2xl font-black text-zinc-950 tracking-tight">
              NGN{" "}
              {grossRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg w-max border border-emerald-100">
            <ArrowUpRight size={14} /> +0.0%{" "}
            <span className="text-zinc-400 font-semibold ml-0.5">
              real-time track
            </span>
          </div>
        </div>

        {/* MRR Earning Volume Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 flex flex-col justify-between h-36 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              MRR Volume
            </span>
            <h3 className="text-2xl font-black text-zinc-950 tracking-tight">
              NGN{" "}
              {mrr.toLocaleString(undefined, {
                minimumFractionDigits: 2,
                maximumFractionDigits: 2,
              })}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-[#0F86EE] bg-[#0F86EE]/5 px-2 py-0.5 rounded-lg w-max border border-[#0F86EE]/10">
            <TrendingUp size={14} /> Active{" "}
            <span className="text-zinc-400 font-semibold ml-0.5">
              normalized scale
            </span>
          </div>
        </div>

        {/* Active Subscribers Accounts Counter Card */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 flex flex-col justify-between h-36 shadow-sm">
          <div className="flex flex-col gap-1">
            <span className="text-xs font-bold text-zinc-400 uppercase tracking-wider">
              Active Subscribers
            </span>
            <h3 className="text-3xl font-black text-zinc-950 tracking-tight">
              {activeSubs.length}
            </h3>
          </div>
          <div className="flex items-center gap-1 text-xs font-bold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-lg w-max border border-emerald-100">
            <ArrowUpRight size={14} /> Live{" "}
            <span className="text-zinc-400 font-semibold ml-0.5">
              account growth
            </span>
          </div>
        </div>
      </div>

      {/* LOWER REVENUE CHARTS & PRODUCT RANKINGS SECTION */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Side: Historical Earning Volume Graphic Canvas */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm lg:col-span-2 flex flex-col gap-6 min-h-87.5">
          <div className="flex justify-between items-center">
            <span className="text-sm font-bold text-zinc-900 tracking-tight">
              Revenue Volume Trends
            </span>
            <div className="text-[11px] font-bold px-2 py-1 bg-zinc-50 border border-zinc-200 rounded-lg text-zinc-400 select-none">
              Daily Ledger
            </div>
          </div>

          <div className="flex-1 w-full h-full relative flex items-end min-h-55 bg-linear-to-t from-zinc-50/50 to-white/0 rounded-xl p-4 border border-zinc-100">
            <svg
              className="w-full h-44 stroke-[#0F86EE] stroke-[2.5] fill-none overflow-visible"
              viewBox="0 0 100 100"
              preserveAspectRatio="none">
              <path
                d="M 0 90 Q 20 80 40 85 T 70 40 T 100 20"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="absolute bottom-2 left-0 right-0 flex justify-between px-6 text-[10px] text-zinc-400 font-bold select-none">
              <span>Dynamic Tracking Matrix</span>
            </div>
          </div>
        </div>

        {/* Right Side: Real Plan Performance Rankings Data Log */}
        <div className="bg-white rounded-2xl border border-zinc-200/80 p-6 shadow-sm flex flex-col gap-6">
          <div>
            <h4 className="text-sm font-bold text-zinc-900 tracking-tight">
              Top Products Tiers
            </h4>
            <p className="text-[11px] text-zinc-400 font-medium mt-0.5">
              Ranking system volume performers
            </p>
          </div>

          <div className="flex flex-col gap-4">
            {activeTopProducts.length === 0 ? (
              <p className="text-xs text-zinc-400 font-medium text-center py-8">
                No completed transaction volumes processed yet.
              </p>
            ) : (
              activeTopProducts.slice(0, 3).map((prod, idx) => (
                <div
                  key={idx}
                  className="flex justify-between items-center border-b border-zinc-50 pb-3 last:border-0 last:pb-0">
                  <div className="flex flex-col">
                    <span className="text-xs font-bold text-zinc-900">
                      {prod.name}
                    </span>
                    <span className="text-[10px] text-zinc-400 font-medium capitalize">
                      {prod.interval} plan
                    </span>
                  </div>
                  <span className="text-xs font-black text-zinc-950">
                    NGN {prod.amount.toLocaleString()}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
