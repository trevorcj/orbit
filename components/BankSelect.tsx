"use client";

import { useEffect, useState, useRef } from "react";
import { Check, ChevronDown, Search } from "lucide-react";

export type Bank = {
  code: string;
  name: string;
  slug?: string;
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
    externalLoading || (initialBanks.length === 0),
  );
  const [error, setError] = useState<string | null>(null);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialBanks.length > 0) {
      setBanks(initialBanks);
      setLoading(false);
      return;
    }

    async function loadBanks() {
      try {
        const res = await fetch("/api/banks");
        const data = await res.json();

        if (!res.ok) {
          setError(data.message || "Failed to load banks");
          setLoading(false);
          return;
        }

        setBanks(data);
        setError(null);
      } catch (err) {
        const msg = err instanceof Error ? err.message : "Network error";
        setError(msg);
      } finally {
        setLoading(false);
      }
    }

    loadBanks();
  }, [initialBanks]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const selectedBank = banks.find((b) => b.code === value);

  const filteredBanks = banks.filter((b) =>
    b.name.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="relative flex flex-col gap-1.5" ref={dropdownRef}>
      <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">Bank</label>
      <button
        type="button"
        disabled={loading}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-3.5 rounded-lg border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#152238] text-left text-sm transition-all focus:outline-none focus:border-[#0F86EE] disabled:bg-zinc-50 dark:disabled:bg-[#0c1524] disabled:cursor-not-allowed cursor-pointer">
        <span className={selectedBank ? "text-zinc-900 dark:text-white font-medium" : "text-zinc-400 dark:text-zinc-500"}>
          {loading
            ? "Loading banks..."
            : selectedBank
              ? selectedBank.name
              : "Select bank"}
        </span>
        <ChevronDown size={16} className={`text-zinc-400 dark:text-zinc-500 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-zinc-200 dark:border-[#1e2d47] bg-white dark:bg-[#111c2e] shadow-xl max-h-72 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95">
          <div className="p-2 border-b border-zinc-100 dark:border-[#1e2d47] bg-zinc-50/50 dark:bg-[#0c1524]">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-zinc-400 dark:text-zinc-500" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bank..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white dark:bg-[#152238] dark:text-white rounded-md border border-zinc-200 dark:border-[#1e2d47] focus:outline-none focus:border-[#0F86EE]"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-56 divide-y divide-zinc-50 dark:divide-[#1e2d47]">
            {filteredBanks.length === 0 ? (
              <div className="p-4 text-xs text-center text-zinc-400 dark:text-zinc-500">
                No bank found matching &ldquo;{search}&rdquo;
              </div>
            ) : (
              filteredBanks.map((bank) => {
                const isSelected = bank.code === value;
                return (
                  <button
                    key={`${bank.code}-${bank.name}`}
                    type="button"
                    onClick={() => {
                      onChange(bank);
                      setIsOpen(false);
                      setSearch("");
                    }}
                    className={`w-full text-left px-4 py-2.5 text-xs flex items-center justify-between transition-colors cursor-pointer ${
                      isSelected
                        ? "bg-blue-50/60 dark:bg-blue-900/30 text-[#0F86EE] dark:text-[#38bdf8] font-semibold"
                        : "hover:bg-zinc-50 dark:hover:bg-[#152238] text-zinc-700 dark:text-zinc-300"
                    }`}>
                    <span>{bank.name}</span>
                    {isSelected && <Check size={14} className="text-[#0F86EE] dark:text-[#38bdf8]" />}
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}

      {error && <p className="text-red-500 text-xs mt-1">{error}</p>}
    </div>
  );
}
