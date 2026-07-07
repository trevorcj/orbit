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
} from "lucide-react";

export type CustomerStatus = "Active" | "Past due" | "Canceled" | "Trialing";

interface Customer {
  id: string;
  name: string;
  email: string;
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
  const [currentPage, setCurrentPage] = useState(1);

  const customersPerPage = 10;

  useEffect(() => {
    const handler = () => setOpenFilter(false);
    window.addEventListener("click", handler);
    return () => window.removeEventListener("click", handler);
  }, []);

  const filtered = useMemo(() => {
    return customers.filter((c) => {
      const matchesSearch =
        c.name.toLowerCase().includes(query.toLowerCase()) ||
        c.email.toLowerCase().includes(query.toLowerCase());

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

          <button className="flex h-11 items-center gap-2 rounded-full text-[15px] bg-[#0F86EE] px-6 font-semibold text-white hover:bg-[#0d7ad9] transition-colors cursor-pointer">
            <Plus size={18} />
            Add customer
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
            placeholder="Search customers..."
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
            <div className="absolute right-0 top-12 w-40 rounded border border-zinc-200 bg-white shadow-sm overflow-hidden z-50">
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
                  className="w-full px-4 py-2.5 text-left text-sm text-zinc-700 hover:bg-zinc-50 transition-colors">
                  {opt === "All" ? "All status" : opt}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Data Table */}
      <div className="w-full overflow-x-auto bg-white rounded-lg border border-zinc-100">
        <table className="w-full border-collapse text-left text-sm text-zinc-600">
          <thead>
            <tr className="border-b border-zinc-100 text-zinc-400 font-medium text-xs">
              <th className="py-4 px-6 font-medium">Customer</th>
              <th className="py-4 px-6 font-medium">Email</th>
              <th className="py-4 px-6 font-medium">Subscriptions</th>
              <th className="py-4 px-6 font-medium">Total spent</th>
              <th className="py-4 px-6 font-medium">Status</th>
              <th className="py-4 px-6 font-medium">Joined</th>
              <th className="py-4 px-4 w-10"></th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-50">
            {paginatedCustomers.map((customer) => (
              <tr
                key={customer.id}
                className="hover:bg-zinc-50/50 transition-colors group">
                <td className="py-4 px-6 font-semibold text-zinc-800">
                  {customer.name}
                </td>
                <td className="py-4 px-6 text-zinc-400">{customer.email}</td>
                <td className="py-4 px-6 text-zinc-600 font-medium">
                  {customer.subscriptions}
                </td>
                <td className="py-4 px-6 font-semibold text-zinc-800">
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
                <td className="py-4 px-6 text-zinc-400">{customer.joined}</td>
                <td className="py-4 px-4 text-center">
                  <button className="p-1 rounded text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 opacity-0 group-hover:opacity-100 transition-opacity">
                    <MoreVertical size={16} />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {filtered.length === 0 && (
          <div className="flex flex-col items-center justify-center py-12 text-zinc-400 text-sm">
            No customers found matching the filters.
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
