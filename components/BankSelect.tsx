"use client";

import { useEffect, useState } from "react";

type Bank = {
  code: string;
  name: string;
};

type Props = {
  value: string;
  onChange: (bank: Bank) => void;
  initialBanks?: Bank[];
  isLoading?: boolean;
};

export default function BankSelect({
  value,
  onChange,
  initialBanks = [],
  isLoading: externalLoading = false,
}: Props) {
  const [banks, setBanks] = useState<Bank[]>(initialBanks);
  const [loading, setLoading] = useState(
    externalLoading || (initialBanks.length === 0 ? true : false),
  );
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    // If initialBanks provided, state is already initialized with them
    if (initialBanks.length > 0) {
      return;
    }

    // Otherwise fetch
    async function loadBanks() {
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();

        if (!res.ok) {
          console.error("Banks API error:", data);
          setError(data.message || "Failed to load banks");
          setLoading(false);
          return;
        }

        setBanks(data);
        setError(null);
        setLoading(false);
      } catch (error) {
        const msg = error instanceof Error ? error.message : "Network error";
        console.error("Error loading banks:", msg);
        setError(msg);
        setLoading(false);
      }
    }

    loadBanks();
  }, [initialBanks]);

  return (
    <div>
      <select
        value={value}
        disabled={loading || error !== null}
        className="border border-orbit-border rounded p-3 w-full"
        onChange={(e) => {
          const bank = banks.find((b) => b.code === e.target.value);

          if (bank) onChange(bank);
        }}>
        <option value="">
          {loading
            ? "Loading banks..."
            : error
              ? "Error loading banks"
              : "Select bank"}
        </option>

        {banks?.map((bank) => (
          <option key={bank.code} value={bank.code}>
            {bank.name}
          </option>
        ))}
      </select>
      {error && <p className="text-red-500 text-sm mt-1">{error}</p>}
    </div>
  );
}
