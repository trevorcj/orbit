"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useState } from "react";
import {
  Home,
  ShoppingBag,
  Users,
  CreditCard,
  Code2,
  Settings,
  HelpCircle,
  LogOut,
  Search,
} from "lucide-react";
import Image from "next/image";

interface DashboardLayoutClientProps {
  children: React.ReactNode;
  userProfile: {
    firstName: string;
    lastName: string;
    email: string;
    avatarUrl: string | null;
  };
  organization: {
    name: string;
    logoUrl: string | null;
  } | null;
  logout: () => Promise<void>;
}

export default function DashboardLayoutClient({
  children,
  userProfile,
  organization,
  logout,
}: DashboardLayoutClientProps) {
  const [mobileOpen, setMobileOpen] = useState(false);

  const pathname = usePathname();

  const getInitials = (text: string) => {
    if (!text) return "";
    return text.trim().charAt(0).toUpperCase();
  };

  const getLinkStyles = (href: string) => {
    const isActive =
      pathname === href ||
      (href !== "/dashboard" && pathname?.startsWith(href));
    return {
      className: `flex items-center gap-3 px-2 py-2.5 rounded-lg text-sm font-semibold transition-colors ${
        isActive
          ? "text-zinc-900 bg-zinc-50"
          : "text-zinc-500 hover:text-zinc-900 hover:bg-zinc-50"
      }`,
      iconColor: isActive ? "text-zinc-900" : "text-zinc-500",
    };
  };

  const userFullName = `${userProfile.firstName} ${userProfile.lastName}`;

  return (
    <div className="flex h-screen w-full bg-white text-zinc-900 antialiased overflow-hidden">
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/30 md:hidden"
        />
      )}

      <aside
        className={`w-64 border-r border-zinc-100 flex flex-col justify-between p-6 bg-white shrink-0
fixed md:static z-50 h-full transition-transform duration-200
${mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
`}>
        <div>
          <div className="flex items-center gap-2 px-2 mb-6">
            <span className="font-black text-xl tracking-tight flex items-center gap-1.5">
              <Image
                src="/orbit-light.svg"
                alt="Orbit Logo"
                width={100}
                height={20}
                className="w-auto h-6"
                priority
              />
            </span>
          </div>

          <div className="relative mb-8">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400"
              size={16}
            />
            <input
              type="text"
              placeholder="Search"
              className="w-full pl-9 pr-4 py-2 rounded bg-zinc-50 border-0 text-sm focus:outline-none focus:ring-1 focus:ring-zinc-200"
            />
          </div>

          <div className="mb-8">
            <p className="px-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              Organisations
            </p>
            <div className="flex items-center gap-3 px-2 py-1.5 rounded hover:bg-zinc-50 cursor-pointer transition-colors">
              {organization?.logoUrl ? (
                <Image
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="w-8 h-8 rounded object-cover"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="w-8 h-8 rounded bg-zinc-100 flex items-center justify-center font-bold text-sm text-zinc-700">
                  {getInitials(organization?.name || "A")}
                </div>
              )}
              <span className="text-sm font-semibold text-zinc-700 truncate max-w-35">
                {organization?.name || "Acme Inc."}
              </span>
            </div>
          </div>

          <nav className="space-y-1">
            <p className="px-2 text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-3">
              General
            </p>

            {(() => {
              const state = getLinkStyles("/dashboard");
              return (
                <Link
                  href="/dashboard"
                  className={state.className}
                  onClick={() => setMobileOpen(false)}>
                  <Home size={18} className={state.iconColor} />
                  Dashboard
                </Link>
              );
            })()}

            {(() => {
              const state = getLinkStyles("/dashboard/products");
              return (
                <Link
                  href="/dashboard/products"
                  className={state.className}
                  onClick={() => setMobileOpen(false)}>
                  <ShoppingBag size={18} className={state.iconColor} />
                  Products
                </Link>
              );
            })()}

            {(() => {
              const state = getLinkStyles("/dashboard/customers");
              return (
                <Link
                  href="/dashboard/customers"
                  className={state.className}
                  onClick={() => setMobileOpen(false)}>
                  <Users size={18} className={state.iconColor} />
                  Customers
                </Link>
              );
            })()}

            {(() => {
              const state = getLinkStyles("/dashboard/subscriptions");
              return (
                <Link
                  href="/dashboard/subscriptions"
                  className={state.className}
                  onClick={() => setMobileOpen(false)}>
                  <CreditCard size={18} className={state.iconColor} />
                  Subscriptions
                </Link>
              );
            })()}

            {(() => {
              const state = getLinkStyles("/dashboard/developers");
              return (
                <Link
                  href="/dashboard/developers"
                  className={state.className}
                  onClick={() => setMobileOpen(false)}>
                  <Code2 size={18} className={state.iconColor} />
                  Developers
                </Link>
              );
            })()}
          </nav>
        </div>

        <div className="space-y-6">
          <nav className="space-y-1">
            {(() => {
              const state = getLinkStyles("/dashboard/settings");
              return (
                <Link
                  href="/dashboard/settings"
                  className={state.className}
                  onClick={() => setMobileOpen(false)}>
                  <Settings size={18} className={state.iconColor} />
                  Settings
                </Link>
              );
            })()}
            <Link
              href="#"
              className="flex items-center gap-3 px-2 py-2 rounded text-sm font-semibold text-zinc-500 hover:text-zinc-900 transition-colors"
              onClick={() => setMobileOpen(false)}>
              <HelpCircle size={18} />
              Help Center
            </Link>
          </nav>

          <div className="pt-4 border-t border-zinc-100 flex items-center justify-between">
            <div className="flex items-center gap-3">
              {userProfile?.avatarUrl ? (
                <Image
                  src={userProfile?.avatarUrl}
                  alt={userFullName}
                  className="w-9 h-9 rounded-full object-cover shadow-sm"
                  width={36}
                  height={36}
                />
              ) : (
                <div className="w-9 h-9 rounded-full bg-zinc-900 text-white font-bold flex items-center justify-center text-sm shadow-sm">
                  {getInitials(userProfile.firstName)}
                </div>
              )}

              <div className="flex flex-col text-left">
                <span className="text-sm font-bold text-zinc-800 leading-none truncate max-w-30">
                  {userFullName}
                </span>
                <span className="text-xs text-zinc-500 mt-0.5 truncate max-w-30">
                  {userProfile.email}
                </span>
              </div>
            </div>
            <button
              type="button"
              className="text-zinc-900 cursor-pointer bg-transparent border-0 p-1 flex items-center justify-center transition-colors"
              onClick={() => {
                startTransition(async () => {
                  await logout();
                });
              }}
              aria-label="Log out">
              <LogOut size={18} />
            </button>{" "}
          </div>
        </div>
      </aside>
      <main className="flex-1 overflow-y-auto bg-white p-10 text-left">
        <div className="mb-6 flex items-center gap-3 md:hidden">
          <button
            onClick={() => setMobileOpen(true)}
            className="h-10 rounded-xl border border-zinc-200 px-4 text-sm">
            Menu
          </button>
        </div>
        {children}
      </main>
    </div>
  );
}
