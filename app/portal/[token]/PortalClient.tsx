"use client";

import { useState } from "react";

export default function PortalClient({ customer }: { customer }) {
  const subscription = customer.subscriptions?.[0];

  const [loading, setLoading] = useState(false);

  async function cancelSubscription() {
    setLoading(true);

    await fetch("/api/portal/cancel", {
      method: "POST",
      body: JSON.stringify({
        subscriptionId: subscription.id,
      }),
    });

    window.location.reload();
  }

  return (
    <div className="min-h-screen bg-zinc-50 p-8">
      <div className="max-w-xl mx-auto bg-white rounded-xl border p-6">
        <h1 className="text-2xl font-bold">Hello {customer.first_name}</h1>

        <p className="text-zinc-500 mt-1">{customer.email}</p>

        <div className="mt-8 border rounded-lg p-5">
          <h2 className="font-semibold">Subscription</h2>

          <p className="mt-3">Product: {subscription?.products?.name}</p>

          <p>Plan: {subscription?.plans?.name}</p>

          <p>Status: {subscription?.status}</p>

          <p>
            Next billing:{" "}
            {subscription?.renews_at
              ? new Date(subscription.renews_at).toDateString()
              : "-"}
          </p>

          {subscription?.status === "ACTIVE" && (
            <button
              onClick={cancelSubscription}
              disabled={loading}
              className="mt-5 bg-red-500 text-white px-4 py-2 rounded-lg">
              {loading ? "Canceling..." : "Cancel Subscription"}
            </button>
          )}
        </div>

        <div className="mt-6">
          <h2 className="font-semibold mb-3">Payments</h2>

          {customer.payments.map((payment) => (
            <div
              key={payment.id}
              className="border-b py-3 flex justify-between">
              <span>₦{payment.amount}</span>

              <span>{payment.status}</span>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
