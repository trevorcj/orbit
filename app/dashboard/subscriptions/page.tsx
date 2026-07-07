import { createClient } from "@/lib/supabase/server";
import { Layers, Calendar, CreditCard, ShieldCheck } from "lucide-react";

export const revalidate = 0;

export default async function SubscriptionsManagementPage() {
  const supabase = await createClient();

  // 1. DYNAMIC SESSION LOOKUP: Read active organization matching the signed-in workspace owner
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: org } = await supabase
    .from("organisations")
    .select("id")
    .eq("user_id", user.id)
    .maybeSingle();

  const orgId = org?.id;

  // 2. DATA EXTRACTION: Query metrics restricted tightly to current merchant domain boundaries
  const { data: subsData } = orgId
    ? await supabase
        .from("subscriptions")
        .select(
          "id, status, plan_id, customer_id, card_token, starts_at, renews_at, provider",
        )
        .eq("organisation_id", orgId)
    : { data: null };

  const { data: plansData } = orgId
    ? await supabase.from("plans").select("id, name, amount, billing_interval")
    : { data: null };

  const { data: customersData } = orgId
    ? await supabase
        .from("customers")
        .select("id, email, first_name, last_name")
    : { data: null };

  const subscriptions = subsData || [];
  const plans = plansData || [];
  const customers = customersData || [];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Title Segment View Controls */}
      <div className="flex justify-between items-center border-b border-zinc-200/40 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">
            Billing Subscriptions
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Monitor core active billing cycles and card tokenization horizons
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-white border border-zinc-200 rounded-xl shadow-sm text-zinc-500">
          Total Subscriptions: {subscriptions.length}
        </span>
      </div>

      {/* CORE LOG DATATABLE DISPLAY SYSTEM */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/60 border-b border-zinc-100 text-[11px] uppercase tracking-wider text-zinc-400 font-bold select-none">
                <th className="p-4 pl-6">Subscriber Target</th>
                <th className="p-4">Assigned Plan Tier</th>
                <th className="p-4">Recurring Authorisation</th>
                <th className="p-4">Lifecycle Status</th>
                <th className="p-4 pr-6">Next Billing Horizon</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {subscriptions.length === 0 ? (
                <tr>
                  <td
                    colSpan={5}
                    className="p-12 text-center text-zinc-400 font-medium">
                    No active platform subscriber account layers processed yet.
                  </td>
                </tr>
              ) : (
                subscriptions.map((sub) => {
                  const customer = customers.find(
                    (c) => c.id === sub.customer_id,
                  );
                  const plan = plans.find((p) => p.id === sub.plan_id);

                  const firstName = customer?.first_name || "";
                  const lastName = customer?.last_name || "";
                  const fullName =
                    firstName || lastName
                      ? `${firstName} ${lastName}`
                      : "Live Subscriber";
                  const displayEmail =
                    customer?.email || "unmapped_email@example.com";

                  const planName = plan?.name || "SaaS Tier Base";
                  const interval = plan?.billing_interval
                    ? plan.billing_interval.toUpperCase()
                    : "MONTHLY";
                  const amount = plan?.amount ? Number(plan.amount) : 0;

                  // Format subscription next_billing_date parameters cleanly matching step 21
                  const nextBillingDate = sub.renews_at
                    ? new Date(sub.renews_at).toLocaleDateString(undefined, {
                        year: "numeric",
                        month: "short",
                        day: "numeric",
                      })
                    : "On-demand authorization";

                  return (
                    <tr
                      key={sub.id}
                      className="hover:bg-zinc-50/30 transition-colors">
                      {/* Subscriber Target Context Column Group */}
                      <td className="p-4 pl-6">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-950 tracking-tight">
                            {fullName}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            {displayEmail}
                          </span>
                        </div>
                      </td>

                      {/* Pricing Configuration Details Column Group */}
                      <td className="p-4">
                        <div className="flex flex-col">
                          <span className="font-semibold text-zinc-950">
                            {planName}
                          </span>
                          <span className="text-xs text-zinc-400 font-medium">
                            ₦{amount.toLocaleString()}.00 / {interval}
                          </span>
                        </div>
                      </td>

                      {/* Stored Token Card Validation Status Badge Column Group */}
                      <td className="p-4">
                        {sub.card_token ? (
                          <span className="inline-flex items-center gap-1 text-xs text-emerald-600 font-semibold bg-emerald-50/50 px-2 py-0.5 rounded-lg border border-emerald-100">
                            <ShieldCheck size={12} /> Stored Token Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-400 font-medium bg-zinc-50 px-2 py-0.5 rounded-lg border border-zinc-200/60">
                            <CreditCard size={12} /> Standard Check
                          </span>
                        )}
                      </td>

                      {/* Contract Lifespan Badging Column Group */}
                      <td className="p-4">
                        {sub.status.toUpperCase() === "ACTIVE" ? (
                          <span className="inline-flex items-center h-5 px-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/40 select-none">
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center h-5 px-2 rounded-full bg-amber-50 text-amber-700 text-xs font-semibold border border-amber-200/40 select-none">
                            Past Due
                          </span>
                        )}
                      </td>

                      {/* Dynamic Target Milestone Renewal Date */}
                      <td className="p-4 pr-6 font-medium text-zinc-500 text-xs tracking-tight">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} className="text-zinc-400" />{" "}
                          {nextBillingDate}
                        </span>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
