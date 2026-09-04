"use client";

import { useEffect, useMemo, useState } from "react";
import {
  Search,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Download,
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
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  const [menuCoords, setMenuCoords] = useState<{ top: number; right: number } | null>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [currentPage, setCurrentPage] = useState(1);

  const customersPerPage = 10;

  useEffect(() => {
    const handler = () => {
      setOpenFilter(false);
      setActiveCustomer(null);
      setMenuCoords(null);
    };
    window.addEventListener("click", handler);
    window.addEventListener("scroll", handler, true);
    window.addEventListener("resize", handler);
    return () => {
      window.removeEventListener("click", handler);
      window.removeEventListener("scroll", handler, true);
      window.removeEventListener("resize", handler);
    };
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
      text: "text-emerald-700",
      bg: "bg-emerald-50",
      border: "border-emerald-200",
    },
    "Past due": {
      text: "text-amber-700",
      bg: "bg-amber-50",
      border: "border-amber-200",
    },
    Canceled: {
      text: "text-zinc-600",
      bg: "bg-zinc-100",
      border: "border-zinc-200",
    },
    Trialing: {
      text: "text-indigo-700",
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

  const handleOpenMenu = (
    customer: Customer,
    e: React.MouseEvent<HTMLButtonElement>,
  ) => {
    e.stopPropagation();
    if (activeCustomer?.id === customer.id) {
      setActiveCustomer(null);
      setMenuCoords(null);
      return;
    }
    const rect = e.currentTarget.getBoundingClientRect();
    setMenuCoords({
      top: rect.bottom + 6,
      right: window.innerWidth - rect.right,
    });
    setActiveCustomer(customer);
  };

  const handleExportCSV = () => {
    if (!filtered.length) return;

    const headers = [
      "ID",
      "Customer",
      "Email",
      "Subscriptions",
      "Total spent",
      "Status",
      "Joined",
    ];

    const rows = filtered.map((c) => [
      c.id,
      c.name,
      c.email,
      c.subscriptions,
      c.totalSpent,
      c.status,
      c.joined,
    ]);

    const csv = [headers, ...rows]
      .map((row) =>
        row.map((item) => `"${String(item).replaceAll('"', '""')}"`).join(","),
      )
      .join("\n");

    const blob = new Blob([csv], {
      type: "text/csv;charset=utf-8;",
    });

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `orbit_customers_export_${
      new Date().toISOString().split("T")[0]
    }.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="flex flex-col gap-8 w-full max-w-full mx-auto relative">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex flex-col gap-1">
          <h1 className="text-2xl font-bold text-zinc-900 tracking-tight">Customers</h1>
          <p className="text-sm text-zinc-500">
            Manage your subscribers and track customer billing history
          </p>
        </div>

        <div className="flex items-center gap-3">
          <button
            onClick={handleExportCSV}
            className="flex h-10 items-center gap-2 rounded-lg border border-zinc-200 px-4 text-xs font-semibold text-zinc-700 bg-white hover:bg-zinc-50 transition-colors cursor-pointer">
            <Download size={15} />
            <span>Export CSV</span>
          </button>
        </div>
      </div>

      {/* Search & Filter Bar - Fully Responsive */}
      <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 w-full">
        <div className="relative flex-1 max-w-md">
          <Search
            className="absolute left-3.5 top-1/2 -translate-y-1/2 text-zinc-400"
            size={16}
          />

          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Search by name, email, or ID..."
            className="h-10 w-full rounded-lg bg-[#F0F6FA] border border-transparent focus:border-[#0F86EE] focus:bg-transparent pl-10 pr-4 text-xs text-zinc-900 placeholder:text-zinc-400 focus:outline-none transition-all"
          />
        </div>

        <div className="relative w-full sm:w-44" onClick={(e) => e.stopPropagation()}>
          <button
            onClick={() => setOpenFilter(!openFilter)}
            className="flex h-10 w-full items-center justify-between rounded-lg border border-zinc-200 bg-white px-3.5 text-xs font-semibold text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
            <span>{status === "All" ? "All statuses" : status}</span>
            <ChevronDown size={15} className="text-zinc-400" />
          </button>

          {openFilter && (
            <div className="absolute right-0 top-11 w-full sm:w-44 rounded-lg border border-zinc-200 bg-white shadow-xl overflow-hidden z-50 py-1 animate-in fade-in">
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
                  className="w-full px-3.5 py-2 text-left text-xs font-medium text-zinc-700 hover:bg-zinc-50 transition-colors cursor-pointer">
                  {opt === "All" ? "All statuses" : opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto bg-white rounded-xl border border-zinc-200/80 shadow-xs">
        <table className="w-full border-collapse text-left text-xs text-zinc-600">
          <thead>
            <tr className="border-b border-zinc-100 bg-zinc-50/50 text-zinc-400 font-semibold uppercase tracking-wider text-[11px]">
              <th className="py-3 px-6 font-semibold">Customer</th>
              <th className="py-3 px-6 font-semibold">Email</th>
              <th className="py-3 px-6 font-semibold">Subscriptions</th>
              <th className="py-3 px-6 font-semibold">Total Spent</th>
              <th className="py-3 px-6 font-semibold">Status</th>
              <th className="py-3 px-6 font-semibold">Joined</th>
              <th className="py-3 px-4 w-12 text-center font-semibold">Action</th>
            </tr>
          </thead>

          <tbody className="divide-y divide-zinc-100">
            {paginatedCustomers.length > 0 ? (
              paginatedCustomers.map((customer) => (
                <tr
                  key={customer.id}
                  className="hover:bg-zinc-50/70 transition-colors">
                  <td className="py-3.5 px-6 font-semibold text-zinc-900">
                    <div className="flex items-center gap-2.5">
                      <div className="h-7 w-7 rounded-full bg-blue-50 text-[#0F86EE] font-bold text-xs flex items-center justify-center shrink-0">
                        {customer.name.charAt(0).toUpperCase()}
                      </div>
                      <span className="truncate max-w-40">{customer.name}</span>
                    </div>
                  </td>

                  <td className="py-3.5 px-6 text-zinc-600 font-medium">
                    {customer.email}
                  </td>

                  <td className="py-3.5 px-6 font-semibold text-zinc-800">
                    {customer.subscriptions}
                  </td>

                  <td className="py-3.5 px-6 font-bold text-zinc-900">
                    {customer.totalSpent}
                  </td>

                  <td className="py-3.5 px-6">
                    <span
                      className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider border ${
                        statusConfig[customer.status]?.bg
                      } ${statusConfig[customer.status]?.text} ${
                        statusConfig[customer.status]?.border
                      }`}>
                      {customer.status}
                    </span>
                  </td>

                  <td className="py-3.5 px-6 text-zinc-400 font-medium">
                    {customer.joined}
                  </td>

                  <td className="py-3.5 px-4 text-center">
                    <button
                      onClick={(e) => handleOpenMenu(customer, e)}
                      className="p-1.5 rounded-md hover:bg-zinc-100 text-zinc-400 hover:text-zinc-700 transition cursor-pointer"
                      aria-label="Customer actions">
                      <MoreVertical size={16} />
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={7} className="py-12 text-center text-zinc-400 text-xs">
                  No customers found matching your criteria.
                </td>
              </tr>
            )}
          </tbody>
        </table>

        {/* Pagination Footer */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-6 py-4 border-t border-zinc-100 bg-white">
            <span className="text-xs text-zinc-400 font-medium">
              Showing {(currentPage - 1) * customersPerPage + 1}–
              {Math.min(currentPage * customersPerPage, totalCustomers)} of{" "}
              {totalCustomers} customers
            </span>

            <div className="flex items-center gap-1">
              <button
                disabled={currentPage === 1}
                onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                className="p-1.5 disabled:opacity-30 text-zinc-400 hover:bg-zinc-100 rounded transition cursor-pointer">
                <ChevronLeft size={16} />
              </button>

              {Array.from({ length: totalPages }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setCurrentPage(i + 1)}
                  className={`w-7 h-7 rounded text-xs font-semibold cursor-pointer transition ${
                    currentPage === i + 1
                      ? "bg-[#0F86EE] text-white"
                      : "hover:bg-zinc-100 text-zinc-600"
                  }`}>
                  {i + 1}
                </button>
              ))}

              <button
                disabled={currentPage === totalPages}
                onClick={() =>
                  setCurrentPage((p) => Math.min(p + 1, totalPages))
                }
                className="p-1.5 disabled:opacity-30 text-zinc-400 hover:bg-zinc-100 rounded transition cursor-pointer">
                <ChevronRight size={16} />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Floating Action Menu */}
      {activeCustomer && menuCoords && (
        <div
          style={{ top: menuCoords.top, right: menuCoords.right }}
          onClick={(e) => e.stopPropagation()}
          className="fixed z-50 w-52 rounded-xl border border-zinc-200 bg-white p-1.5 shadow-xl text-xs flex flex-col gap-0.5 animate-in fade-in">
          <button
            onClick={() => copyToClipboard(activeCustomer.id, "Customer ID")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-50 text-zinc-700 font-medium text-left transition cursor-pointer">
            <Copy size={13} className="text-zinc-400" />
            <span>Copy Customer ID</span>
          </button>

          <button
            onClick={() => copyToClipboard(activeCustomer.email, "Customer Email")}
            className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-50 text-zinc-700 font-medium text-left transition cursor-pointer">
            <Mail size={13} className="text-zinc-400" />
            <span>Copy Email</span>
          </button>

          {activeCustomer.portalToken && (
            <a
              href={`/portal/${activeCustomer.portalToken}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-zinc-50 text-zinc-700 font-medium text-left transition cursor-pointer">
              <ExternalLink size={13} className="text-zinc-400" />
              <span>Open Customer Portal</span>
            </a>
          )}
        </div>
      )}
    </div>
  );
}
