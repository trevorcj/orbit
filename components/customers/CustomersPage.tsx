"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
  Plus,
  MoreVertical,
  Copy,
  Mail,
  ExternalLink,
  Code2,
  Check,
} from "lucide-react";
import { toast } from "sonner";

export type CustomerStatus = "Active" | "Past due" | "Canceled" | "Trialing";

interface Customer {
  id: string;
  name: string;
  email: string;
  portalToken?: string | null;
  subscriptions: number;
  totalSpent: string;
  status: CustomerStatus;
  joined: string;
}

interface CustomersPageProps {
  customers: Customer[];
}

export default function CustomersPage({ customers }: CustomersPageProps) {
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState<
    "All" | "Active" | "Past due" | "Canceled" | "Trialing"
  >("All");
  const [openFilter, setOpenFilter] = useState(false);
  const [activeMenuId, setActiveMenuId] = useState<string | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const customersPerPage = 10;

  useEffect(() => {
    const handler = () => {
      setOpenFilter(false);
      setActiveMenuId(null);
    };
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase()) ||
        c.id.toLowerCase().includes(query.toLowerCase());

      const matchesStatus = status === "All" ? true : c.status === status;

      return matchesSearch && matchesStatus;
    });
  }, [query, status, customers]);

  const totalCustomers = filtered.length;
  const totalPages = Math.ceil(totalCustomers / customersPerPage);

  const paginatedCustomers = filtered.slice(
    (currentPage - 1) * customersPerPage,
    currentPage * customersPerPage,
  );

  const statusConfig = {
    Active: {
      text: "text-emerald-600",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    "Past due": {
      text: "text-orange-600",
      bg: "bg-orange-50",
      border: "border-orange-200",
    },
    Canceled: {
      text: "text-red-600",
      bg: "bg-red-50",
      border: "border-red-200",
    },
    Trialing: {
      text: "text-indigo-600",
      bg: "bg-indigo-50",
      border: "border-indigo-200",
    },
  };

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(text);
    toast.success(`${label} copied to clipboard`);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleExportCSV = () => {
    const headers = [
      "ID",
      "Customer",
      "Email",
      "Subscriptions",
      "Total Spent",
      "Status",
      "Joined",
    ];

    const rows = filtered.map((customer) => [
      customer.id,
      customer.name,
      customer.email,
      customer.subscriptions,
      customer.totalSpent,
      customer.status,
      customer.joined,
    ]);

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((value) => `"${String(value).replace(/"/g, '""')}"`)
            .join(","),
        ),
      ].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `orbit_customers_export_${new Date().toISOString().split("T")[0]}.csv`,
    );

    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-full mx-auto p-6">
      {/* Top Header Section */}
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-900">Customers</h1>
          <p className="text-sm text-zinc-500">
            Manage your customers and see their subscription activity.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex h-11 items-center gap-2 rounded-lg border border-zinc-200 px-5 text-sm font-medium text-zinc-700 bg-white hover:bg-zinc-50 transition-colors cursor-pointer">
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Control Actions (Search & Filter) */}
      <div className="flex items-center justify-between gap-3 w-full">
        <div className="relative w-[320px]">
          <Search
            className="absolute left-4 top-1/2 -translate-y-1/2 text-zinc-400"
            size={18}
          />

          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email, or ID..."
            className="h-11 w-full rounded border border-zinc-200 pl-11 pr-4 text-[14px] transition-all duration-200 focus:outline-none focus:border-zinc-300"
          />
        </div>

        <div className="relative" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOpenFilter(!openFilter)}
            className="flex h-11 w-40 items-center justify-between rounded border border-zinc-200 px-4 text-sm text-zinc-700 bg-white transition-all duration-200 focus:outline-none focus:border-zinc-300">
            {status === "All" ? "All status" : status}
            <ChevronDown size={18} className="text-zinc-500" />
          </button>

          {openFilter && (
            <div className="absolute right-0 top-12 w-40 rounded-lg border border-zinc-200 bg-white shadow-lg overflow-hidden z-50 py-1">
              {(
                ["All", "Active", "Past due", "Canceled", "Trialing"] as const
              ).map((opt) => (
                <button
                  key={opt}
                  onClick={() => {
                    setStatus(opt);
                    setCurrentPage(1);
                    setOpenFilter(false);
                  }}
                  className="w-full px-4 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors">
                  {opt === "All" ? "All status" : opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto bg-white rounded-xl border border-zinc-200 shadow-xs">
        <table className="w-full border-collapse text-left text-sm text-zinc-600">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-500 font-medium text-xs">
              <th className="py-3.5 px-6 font-semibold">Customer</th>
              <th className="py-3.5 px-6 font-semibold">Email</th>
              <th className="py-3.5 px-6 font-semibold">Subscriptions</th>
              <th className="py-3.5 px-6 font-semibold">Total spent</th>
              <th className="py-3.5 px-6 font-semibold">Status</th>
              <th className="py-3.5 px-6 font-semibold">Joined</th>
              <th className="py-3.5 px-4 w-12 text-center font-semibold">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-100">
            {paginatedCustomers.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-zinc-50/70 transition-colors group">
                <td className="py-4 px-6 font-semibold text-zinc-900">
                  <div className="flex flex-col">
                    <span>{customer.name}</span>
                    <span className="text-[11px] font-mono text-zinc-400 font-normal">
                      {customer.id}
                    </span>
                  </div>
                </td>
                <td className="py-4 px-6 text-zinc-500">{customer.email}</td>
                <td className="py-4 px-6 text-zinc-700 font-medium">
                  {customer.subscriptions}
                </td>
                <td className="py-4 px-6 font-semibold text-zinc-900">
                  {customer.totalSpent}
                </td>
                <td className="py-4 px-6">
                  <span
                    className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium border ${
                      statusConfig[customer.status].bg
                    } ${statusConfig[customer.status].text} ${statusConfig[customer.status].border}`}>
                    {customer.status}
                  </span>
                </td>
                <td className="py-4 px-6 text-zinc-500 text-xs">{customer.joined}</td>
                <td className="py-4 px-4 text-center relative" onClick={(e) => e.stopPropagation()}>
                  <button
                    onClick={() =>
                      setActiveMenuId(
                        activeMenuId === customer.id ? null : customer.id,
                      )
                    }
                    className="p-1.5 rounded-md text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100 transition-colors cursor-pointer">
                    <MoreVertical size={16} />
                  </button>

                  {activeMenuId === customer.id && (
                    <div className="absolute right-4 top-12 w-56 rounded-xl border border-zinc-200 bg-white shadow-xl py-1.5 z-50 text-left">
                      <div className="px-3 py-1.5 border-b border-zinc-100 text-[11px] font-medium text-zinc-400 uppercase tracking-wider">
                        Customer Actions
                      </div>

                      <button
                        onClick={() => {
                          copyToClipboard(customer.id, "Customer ID");
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                        {copiedId === customer.id ? (
                          <Check size={14} className="text-emerald-600" />
                        ) : (
                          <Copy size={14} className="text-zinc-400" />
                        )}
                        <span>Copy Customer ID</span>
                      </button>

                      <button
                        onClick={() => {
                          copyToClipboard(customer.email, "Customer Email");
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                        <Mail size={14} className="text-zinc-400" />
                        <span>Copy Email Address</span>
                      </button>

                      <button
                        onClick={() => {
                          const apiEndpoint = `/api/v1/customers/${customer.id}/subscription`;
                          copyToClipboard(apiEndpoint, "API Endpoint");
                          setActiveMenuId(null);
                        }}
                        className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-zinc-700 hover:bg-zinc-50 hover:text-zinc-900 transition-colors">
                        <Code2 size={14} className="text-zinc-400" />
                        <span>Copy API Query Route</span>
                      </button>

                      {customer.portalToken && (
                        <a
                          href={`/portal/${customer.portalToken}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          onClick={() => setActiveMenuId(null)}
                          className="w-full flex items-center gap-2.5 px-3 py-2 text-xs font-medium text-[#0F86EE] hover:bg-blue-50/50 transition-colors border-t border-zinc-100">
                          <ExternalLink size={14} />
                          <span>View Customer Portal</span>
                        </a>
                      )}
                    </div>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-sm">
            No customers found matching your search.
          </div>
        )}
      </div>

      {/* Pagination Footer */}
      <div className="flex items-center justify-between border-t border-zinc-100 pt-4 text-sm text-zinc-400">
        <span>
          Showing{" "}
          {totalCustomers === 0 ? 0 : (currentPage - 1) * customersPerPage + 1}{" "}
          to {Math.min(currentPage * customersPerPage, totalCustomers)} of{" "}
          {totalCustomers} customers
        </span>
        <div className="flex items-center gap-1">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
            className="p-2 rounded hover:bg-zinc-100 text-zinc-400 disabled:opacity-40">
            <ChevronLeft size={16} />
          </button>

          {Array.from({ length: totalPages }, (_, i) => i + 1)
            .slice(0, 5)
            .map((page) => (
              <button
                key={page}
                onClick={() => setCurrentPage(page)}
                className={`w-8 h-8 flex items-center justify-center rounded text-xs ${
                  currentPage === page
                    ? "border border-zinc-300 bg-zinc-50 text-blue-600 font-semibold"
                    : "text-zinc-500 hover:bg-zinc-100"
                }`}>
                {page}
              </button>
            ))}

          {totalPages > 5 && <span className="px-1 text-xs">...</span>}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
            className="p-2 rounded hover:bg-zinc-100 text-zinc-400 disabled:opacity-40">
            <ChevronRight size={16} />
          </button>
        </div>
      </div>
    </div>
  );
}
