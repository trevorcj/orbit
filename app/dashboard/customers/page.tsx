import { createClient } from "@/lib/supabase/server";
import { Users, Mail, Phone, Calendar } from "lucide-react";
import Link from "next/link";

export const revalidate = 0;

export default async function CustomersManagementPage() {
  const supabase = await createClient();

  // 1. DYNAMIC SESSION LOOKUP: Read workspace credentials matching the authenticated manager
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

  // 2. DATA EXTRACTION: Pull raw footprints restricted tightly to current merchant domain boundaries
  const { data: customersData } = orgId
    ? await supabase
        .from("customers")
        .select("id, email, first_name, last_name, phone, created_at")
        .eq("organisation_id", orgId)
    : { data: null };

  const { data: subsData } = orgId
    ? await supabase
        .from("subscriptions")
        .select("id, customer_id, status")
        .eq("organisation_id", orgId)
    : { data: null };

  const customers = customersData || [];
  const subscriptions = subsData || [];

  return (
    <div className="flex flex-col gap-6 animate-in fade-in duration-300">
      {/* Title Segment View Controls */}
      <div className="flex justify-between items-center border-b border-zinc-200/40 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-zinc-950">
            Customer Profiles
          </h2>
          <p className="text-xs text-zinc-400 font-medium mt-0.5">
            Manage customer lifecycle records and subscription history logs
          </p>
        </div>
        <span className="text-xs font-semibold px-3 py-1.5 bg-white border border-zinc-200 rounded-xl shadow-sm text-zinc-500">
          Total Customers: {customers.length}
        </span>
      </div>

      {/* CORE LOG DATATABLE DISPLAY SYSTEM */}
      <div className="bg-white rounded-2xl border border-zinc-200/80 shadow-sm overflow-hidden">
        <div className="w-full overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-zinc-50/60 border-b border-zinc-100 text-[11px] uppercase tracking-wider text-zinc-400 font-bold select-none">
                <th className="p-4 pl-6">Customer Context</th>
                <th className="p-4">Contact Parameter</th>
                <th className="p-4">Active Enrolments</th>
                <th className="p-4 pr-6">Joined Date Milestone</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 text-sm">
              {customers.length === 0 ? (
                <tr>
                  <td
                    colSpan={4}
                    className="p-12 text-center text-zinc-400 font-medium">
                    No consumer profile records written to database parameters
                    yet.
                  </td>
                </tr>
              ) : (
                customers.map((customer) => {
                  const firstName = customer.first_name || "";
                  const lastName = customer.last_name || "";
                  const fullName =
                    firstName || lastName
                      ? `${firstName} ${lastName}`
                      : "Live Subscriber";

                  // Compute dynamic contract logs for this specific customer record
                  const customerSubs = subscriptions.filter(
                    (s) => s.customer_id === customer.id,
                  );
                  const activeCount = customerSubs.filter(
                    (s) => s.status.toUpperCase() === "ACTIVE",
                  ).length;

                  const joinedDate = customer.created_at
                    ? new Date(customer.created_at).toLocaleDateString(
                        undefined,
                        { year: "numeric", month: "short", day: "numeric" },
                      )
                    : "No log date";

                  return (
                    <tr
                      key={customer.id}
                      className="hover:bg-zinc-50/30 transition-colors">
                      {/* Identity Column Group */}
                      <td className="p-4 pl-6">
                        <div className="flex items-center gap-3">
                          <div className="h-8 w-8 rounded-full bg-zinc-100 border border-zinc-200 flex items-center justify-center font-bold text-zinc-500 text-xs uppercase">
                            {fullName.substring(0, 2)}
                          </div>
                          <div className="flex flex-col">
                            <span className="font-semibold text-zinc-950 tracking-tight">
                              {fullName}
                            </span>
                            <span className="text-[11px] text-zinc-400 font-mono truncate max-w-[150px]">
                              {customer.id}
                            </span>
                          </div>
                        </div>
                      </td>

                      {/* Contact Channels Column Group */}
                      <td className="p-4">
                        <div className="flex flex-col gap-0.5">
                          <span className="inline-flex items-center gap-1 text-xs text-zinc-600 font-medium">
                            <Mail size={12} className="text-zinc-400" />{" "}
                            {customer.email}
                          </span>
                          {customer.phone && (
                            <span className="inline-flex items-center gap-1 text-[11px] text-zinc-400">
                              <Phone size={12} className="text-zinc-400" />{" "}
                              {customer.phone}
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Dynamic Contract Counter State Badging */}
                      <td className="p-4">
                        {activeCount > 0 ? (
                          <span className="inline-flex items-center h-5 px-2 rounded-full bg-emerald-50 text-emerald-700 text-xs font-semibold border border-emerald-200/40">
                            {activeCount} Active Contract
                            {activeCount > 1 ? "s" : ""}
                          </span>
                        ) : (
                          <span className="inline-flex items-center h-5 px-2 rounded-full bg-zinc-50 text-zinc-400 text-xs font-medium border border-zinc-200/60">
                            Inactive / Churned
                          </span>
                        )}
                      </td>

                      {/* Time Marker Segment */}
                      <td className="p-4 pr-6 font-medium text-zinc-500 text-xs tracking-tight">
                        <span className="inline-flex items-center gap-1">
                          <Calendar size={12} className="text-zinc-400" />{" "}
                          {joinedDate}
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
