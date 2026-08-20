import { createClient } from "@/lib/supabase/server";
import {
  ArrowUpRight,
  TrendingUp,
  Users,
  Clock,
  Plus,
  ExternalLink,
} from "lucide-react";
import Link from "next/link";
import RevenueChart from "@/components/dashboard/RevenueChart";

export const revalidate = 0;

export default async function MerchantDashboardPage() {
  const supabase = await createClient();

  // 1. Authenticated User Context
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return null;

  // 2. Fetch Organization
  const { data: org } = await supabase
    .from("organisations")
    .select("id, name, slug")
    .eq("user_id", user.id)
    .maybeSingle();

  const orgId = org?.id;

  // 3. Query All Related Data within Organization Boundary
  const { data: subsData } = orgId
    ? await supabase
        .from("subscriptions")
        .select(
          "id, status, plan_id, starts_at, renews_at, cancel_at_period_end, created_at",
        )
        .eq("organisation_id", orgId)
    : { data: null };

  const { data: payData } = orgId
    ? await supabase
        .from("payments")
        .select("id, amount, status, paid_at, created_at")
        .eq("organisation_id", orgId)
        .order("paid_at", { ascending: true })
    : { data: null };

  const { data: plansData } = orgId
    ? await supabase
        .from("plans")
        .select("id, name, amount, billing_interval, product_id, is_active")
        .eq("organisation_id", orgId)
    : { data: null };

  const { data: productsData } = orgId
    ? await supabase
        .from("products")
        .select("id, name, slug")
        .eq("organisation_id", orgId)
    : { data: null };

  const subscriptions = subsData || [];
  const payments = payData || [];
  const plans = plansData || [];
  const products = productsData || [];

  // 4. Analytics Calculations
  const successfulPayments = payments.filter(
    (p) => p.status === "success" || p.status === "SUCCESS",
  );

  const grossRevenue = successfulPayments.reduce(
    (acc, p) => acc + Number(p.amount || 0),
    0,
  );

  const activeSubs = subscriptions.filter(
    (s) => s.status.toUpperCase() === "ACTIVE",
  );

  const trialingSubs = subscriptions.filter(
    (s) => s.status.toUpperCase() === "TRIALING",
  );

  const pastDueSubs = subscriptions.filter(
    (s) => s.status.toUpperCase() === "PAST_DUE",
  );

  // Monthly Recurring Revenue (MRR)
  const mrr = activeSubs.reduce((acc, sub) => {
    const plan = plans.find((p) => p.id === sub.plan_id);
    if (!plan) return acc;
    const amountValue = Number(plan.amount || 0);
    if (plan.billing_interval?.toLowerCase() === "yearly") {
      return acc + amountValue / 12;
    }
    return acc + amountValue;
  }, 0);

  // 5. Daily Revenue Breakdown for Past 30 Days
  const now = new Date();
  const dailyDataMap: Record<
    string,
    { amount: number; count: number; label: string }
  > = {};

  for (let i = 29; i >= 0; i--) {
    const d = new Date();
    d.setDate(now.getDate() - i);
    const dateKey = d.toISOString().split("T")[0];
    const label = d.toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
    });
    dailyDataMap[dateKey] = { amount: 0, count: 0, label };
  }

  successfulPayments.forEach((p) => {
    const dateKey = (p.paid_at || p.created_at || "").split("T")[0];
    if (dailyDataMap[dateKey]) {
      dailyDataMap[dateKey].amount += Number(p.amount || 0);
      dailyDataMap[dateKey].count += 1;
    }
  });

  const chartSeries = Object.entries(dailyDataMap).map(([date, val]) => ({
    date,
    label: val.label,
    amount: val.amount,
    count: val.count,
  }));

  // 6. Top Products & Plan Performance
  const planPerformance = plans
    .map((plan) => {
      const planSubCount = subscriptions.filter(
        (s) => s.plan_id === plan.id,
      ).length;
      const planPayments = successfulPayments.filter((p) => {
        const sub = subscriptions.find(
          (s) =>
            s.id ===
            (p as unknown as { subscription_id?: string }).subscription_id,
        );
        return sub?.plan_id === plan.id;
      });

      const totalPlanRevenue = planPayments.reduce(
        (acc, p) => acc + Number(p.amount || 0),
        0,
      );
      const prod = products.find((pr) => pr.id === plan.product_id);

      return {
        id: plan.id,
        name: plan.name,
        productName: prod?.name || "Product",
        amount: Number(plan.amount),
        interval: plan.billing_interval || "monthly",
        subscribers: planSubCount,
        revenue: totalPlanRevenue,
        slug: prod?.slug,
      };
    })
    .sort((a, b) => b.subscribers - a.subscribers || b.revenue - a.revenue);

  return (
    <div className="flex flex-col gap-8 antialiased max-w-full">
      {/* Header Section */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">
            Dashboard
          </h1>
          <p className="text-sm text-zinc-500 mt-0.5">
            Real-time recurring billing metrics for{" "}
            {org?.name || "your workspace"}
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link
            href="/dashboard/products"
            className="h-11 rounded-full text-[15px] bg-[#0F86EE] hover:bg-[#0d7ad9] px-8 font-semibold text-white transition-colors cursor-pointer flex items-center gap-2">
            <Plus size={16} />
            <span>Create product</span>
          </Link>
        </div>
      </div>

      {/* KPI METRIC CARDS */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Gross Revenue Card */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Gross Revenue
            </span>
            <div className="text-2xl font-bold text-zinc-900 tracking-tight mt-2">
              ₦
              {grossRevenue.toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 2,
              })}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="rounded-full bg-emerald-50 text-emerald-700 px-2.5 py-0.5 text-xs font-semibold">
              Live Settled
            </span>
            <span className="text-xs text-zinc-400">Total Volume</span>
          </div>
        </div>

        {/* MRR Volume Card */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Monthly Recurring
            </span>
            <div className="text-2xl font-bold text-zinc-900 tracking-tight mt-2">
              ₦
              {Math.round(mrr).toLocaleString(undefined, {
                minimumFractionDigits: 0,
                maximumFractionDigits: 0,
              })}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="rounded-full bg-blue-50 text-[#0F86EE] px-2.5 py-0.5 text-xs font-semibold">
              MRR Run-rate
            </span>
            <span className="text-xs text-zinc-400">Recurring</span>
          </div>
        </div>

        {/* Active Subscribers Card */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Active Subscribers
            </span>
            <div className="text-2xl font-bold text-zinc-900 tracking-tight mt-2">
              {activeSubs.length}
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="rounded-full border border-zinc-200 px-2.5 py-0.5 text-xs text-zinc-600 font-medium">
              {subscriptions.length} total
            </span>
            <span className="text-xs text-zinc-400">Customer base</span>
          </div>
        </div>

        {/* Trials & Retention Card */}
        <div className="rounded-lg border border-zinc-200 bg-white p-6 flex flex-col justify-between hover:border-zinc-300 transition-colors">
          <div>
            <span className="text-xs font-semibold text-zinc-400 uppercase tracking-wider">
              Trials & Retention
            </span>
            <div className="text-2xl font-bold text-zinc-900 tracking-tight mt-2">
              {trialingSubs.length}{" "}
              <span className="text-sm font-normal text-zinc-400">
                trialing
              </span>
            </div>
          </div>
          <div className="mt-4 pt-4 border-t border-zinc-100 flex items-center justify-between">
            <span className="rounded-full bg-zinc-100 text-zinc-600 px-2.5 py-0.5 text-xs font-medium">
              {pastDueSubs.length} past due
            </span>
            <span className="text-xs text-zinc-400">Retention</span>
          </div>
        </div>
      </div>

      {/* LOWER REVENUE CHARTS SECTION */}
      <div className="w-full">
        {/* Real Dynamic Recharts Area Chart */}
        <div className="rounded-lg border border-zinc-200 bg-white p-7 flex flex-col justify-between">
          <RevenueChart data={chartSeries} totalRevenue={grossRevenue} />
        </div>
      </div>
    </div>
  );
}
