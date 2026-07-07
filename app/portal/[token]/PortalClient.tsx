"use client";

import { useState } from "react";

interface Subscription {
  id: string;
  status: string;
  starts_at: string | null;
  renews_at: string | null;

  products?: {
    name: string;
  }[];

  plans?: {
    name: string;
    amount: number;
    currency: string;
    billing_interval: string;
  }[];
}

interface Payment {
  id: string;
  amount: number;
  status: string;
}

interface Customer {
  first_name: string | null;
  email: string;
  subscriptions?: Subscription[];
  payments: Payment[];
}

export default function PortalClient({ customer }: { customer: Customer }) {
  const subscription = customer.subscriptions?.[0];

  const [loading, setLoading] = useState(false);

  async function cancelSubscription() {
    if (!subscription) return;

    setLoading(true);

    try {
      await fetch("/api/portal/cancel", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          subscriptionId: subscription.id,
        }),
      });

      window.location.reload();
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl border p-6">
        <h1 className="text-2xl font-bold">
          Hello {customer.first_name ?? "Customer"}
        </h1>

        <p className="text-zinc-500 mt-1">{customer.email}</p>

        <div className="mt-8 border rounded-lg p-5">
          <h2 className="font-semibold">Subscription</h2>

          {subscription ? (
            <>
              <p>Product: {subscription.products?.[0]?.name ?? "-"}</p>

              <p>Plan: {subscription.plans?.[0]?.name ?? "-"}</p>

              <p>Status: {subscription.status}</p>

              <p>
                Next billing:{" "}
                {subscription.renews_at
                  ? new Date(subscription.renews_at).toDateString()
                  : "-"}
              </p>

              {subscription.status === "ACTIVE" && (
                <button
                  onClick={cancelSubscription}
                  disabled={loading}
                  className="mt-5 bg-red-500 text-white px-4 py-2 rounded-lg disabled:opacity-50">
                  {loading ? "Canceling..." : "Cancel Subscription"}
                </button>
              )}
            </>
          ) : (
            <p className="mt-3 text-zinc-500">No active subscription.</p>
          )}
        </div>

        <div className="mt-6">
          <h2 className="font-semibold mb-3">Payments</h2>

          {customer.payments?.length ? (
            customer.payments.map((payment) => (
              <div
                key={payment.id}
                className="border-b py-3 flex justify-between">
                <span>₦{payment.amount}</span>

                <span>{payment.status}</span>
              </div>
            ))
          ) : (
            <p className="text-zinc-500">No payments yet.</p>
          )}
        </div>
      </div>
    </div>
  );
}
