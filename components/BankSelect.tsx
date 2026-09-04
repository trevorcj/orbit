"use client";

import { useEffect, useState, useRef } from "react";
import { ChevronDown, Search, Check, Building2, Loader2 } from "lucide-react";

export interface Bank {
  name: string;
  code: string;
  slug?: string;
}

interface BankSelectProps {
  value: string;
  onChange: (bank: Bank) => void;
  error?: string;
  initialBanks?: Bank[];
  isLoading?: boolean;
}

export default function BankSelect({
  value,
  onChange,
  error,
  initialBanks,
  isLoading: externalLoading,
}: BankSelectProps) {
  const [banks, setBanks] = useState<Bank[]>(initialBanks || []);
  const [loading, setLoading] = useState(externalLoading !== undefined ? externalLoading : !initialBanks || initialBanks.length === 0);
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (initialBanks && initialBanks.length > 0) {
      setBanks(initialBanks);
      setLoading(false);
      return;
    }

    async function fetchBanks() {
      try {
        const res = await fetch("/api/banks");
        const json = await res.json();
        if (json.success && Array.isArray(json.banks)) {
          setBanks(json.banks);
        }
      } catch (err) {
        console.error("Failed to load banks:", err);
      } finally {
        setLoading(false);
      }
    }
    fetchBanks();
  }, [initialBanks]);

  const isDropdownLoading = externalLoading !== undefined ? externalLoading : loading;

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
      <label className="text-xs font-semibold text-zinc-700">Bank</label>
      <button
        type="button"
        disabled={isDropdownLoading}
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between h-11 px-3.5 rounded-lg border border-zinc-200 bg-white hover:border-zinc-300 text-left text-sm transition-all focus:outline-none focus:border-[#0F86EE] focus:ring-1 focus:ring-[#0F86EE] disabled:bg-zinc-50 disabled:cursor-not-allowed cursor-pointer">
        <span className={selectedBank ? "text-zinc-900 font-medium text-xs" : "text-zinc-400 text-xs"}>
          {isDropdownLoading
            ? "Loading banks..."
            : selectedBank
              ? selectedBank.name
              : "Select bank"}
        </span>
        <ChevronDown size={16} className={`text-zinc-400 transition-transform duration-200 ${isOpen ? "rotate-180" : ""}`} />
      </button>

      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-1 z-50 rounded-xl border border-zinc-200 bg-white shadow-xl max-h-72 overflow-hidden flex flex-col animate-in fade-in-50 zoom-in-95">
          <div className="p-2 border-b border-zinc-100 bg-zinc-50/50">
            <div className="relative flex items-center">
              <Search size={14} className="absolute left-3 text-zinc-400" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search bank..."
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-white rounded-md border border-zinc-200 hover:border-zinc-300 focus:outline-none focus:border-[#0F86EE] focus:ring-1 focus:ring-[#0F86EE] transition-colors"
                autoFocus
              />
            </div>
          </div>

          <div className="overflow-y-auto max-h-56 divide-y divide-zinc-50">
            {filteredBanks.length === 0 ? (
              <div className="p-4 text-xs text-center text-zinc-400">
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
                        ? "bg-blue-50/60 text-[#0F86EE] font-semibold"
                        : "hover:bg-zinc-50 text-zinc-700"
                    }`}>
                    <span>{bank.name}</span>
                    {isSelected && <Check size={14} className="text-[#0F86EE]" />}
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
