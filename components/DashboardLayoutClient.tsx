"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { startTransition, useState } from "react";
import {
  Home,
  ShoppingBag,
  Users,
  CreditCard,
  Settings,
  HelpCircle,
  LogOut,
  Search,
  Menu,
  X,
  HandCoins,
  Sparkles,
} from "lucide-react";
import Image from "next/image";
import ProductTour, { startOrbitProductTour } from "@/components/ProductTour";

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
      className: `flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
        isActive
          ? "text-zinc-900 dark:text-white bg-zinc-100 dark:bg-[#131f33]"
          : "text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white hover:bg-zinc-50 dark:hover:bg-[#131f33]"
      }`,
      iconColor: isActive
        ? "text-zinc-900 dark:text-white"
        : "text-zinc-500 dark:text-zinc-400",
    };
  };

  const userFullName = `${userProfile.firstName} ${userProfile.lastName}`;

  return (
    <div className="flex h-screen w-full bg-white dark:bg-[#0B1320] text-zinc-900 dark:text-zinc-100 antialiased overflow-hidden">
      {/* Mobile Backdrop */}
      {mobileOpen && (
        <div
          onClick={() => setMobileOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-xs md:hidden"
        />
      )}

      {/* Sidebar Drawer */}
      <aside
        className={`w-64 border-r border-zinc-200/80 dark:border-[#1a2942] flex flex-col justify-between p-5 bg-white dark:bg-[#09101d] shrink-0 fixed md:static z-50 h-full transition-transform duration-200 ease-in-out ${
          mobileOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"
        }`}>
        <div>
          {/* Top Logo & Mobile Close Button */}
          <div className="flex items-center justify-between px-2 mb-6">
            <Link
              href="/dashboard"
              className="flex items-center gap-1.5"
              onClick={() => setMobileOpen(false)}>
              <Image
                src="/orbit-light.svg"
                alt="Orbit Logo"
                width={95}
                height={20}
                className="w-auto h-5 block dark:hidden"
                priority
              />
              <Image
                src="/orbit-dark.svg"
                alt="Orbit Logo"
                width={95}
                height={20}
                className="w-auto h-5 hidden dark:block"
                priority
              />
            </Link>

            <button
              onClick={() => setMobileOpen(false)}
              className="p-1 rounded-md text-zinc-400 hover:text-zinc-700 dark:hover:text-zinc-200 md:hidden cursor-pointer">
              <X size={18} />
            </button>
          </div>

          {/* Quick Search Bar */}
          <div className="relative mb-6">
            <Search
              className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400 dark:text-zinc-500"
              size={15}
            />
            <input
              type="text"
              placeholder="Search..."
              className="w-full pl-9 pr-3 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#131f33] border border-zinc-200 dark:border-[#1a2942] text-xs text-zinc-900 dark:text-white placeholder-zinc-400 dark:placeholder-zinc-500 focus:outline-none focus:border-[#0F86EE]"
            />
          </div>

          {/* Organization Switcher / Badge */}
          <div className="mb-6">
            <p className="px-2 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              Organisation
            </p>
            <div className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg bg-zinc-50 dark:bg-[#111c2e] border border-zinc-200/60 dark:border-[#1e2d47]">
              {organization?.logoUrl ? (
                <Image
                  src={organization.logoUrl}
                  alt={organization.name}
                  className="w-7 h-7 rounded object-cover"
                  width={28}
                  height={28}
                />
              ) : (
                <div className="w-7 h-7 rounded bg-[#0F86EE]/10 dark:bg-[#0F86EE]/20 text-[#0F86EE] dark:text-[#38bdf8] flex items-center justify-center font-bold text-xs">
                  {getInitials(organization?.name || "A")}
                </div>
              )}
              <span className="text-xs font-semibold text-zinc-800 dark:text-zinc-200 truncate max-w-36">
                {organization?.name || "Acme Inc."}
              </span>
            </div>
          </div>

          {/* General Navigation Links */}
          <nav className="space-y-1">
            <p className="px-2 text-[11px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-wider mb-2">
              General
            </p>

            <Link
              href="/dashboard"
              className={getLinkStyles("/dashboard").className}
              onClick={() => setMobileOpen(false)}>
              <Home
                size={17}
                className={getLinkStyles("/dashboard").iconColor}
              />
              Dashboard
            </Link>

            <Link
              id="tour-nav-products"
              href="/dashboard/products"
              className={getLinkStyles("/dashboard/products").className}
              onClick={() => setMobileOpen(false)}>
              <ShoppingBag
                size={17}
                className={getLinkStyles("/dashboard/products").iconColor}
              />
              Products
            </Link>

            <Link
              id="tour-nav-customers"
              href="/dashboard/customers"
              className={getLinkStyles("/dashboard/customers").className}
              onClick={() => setMobileOpen(false)}>
              <Users
                size={17}
                className={getLinkStyles("/dashboard/customers").iconColor}
              />
              Customers
            </Link>

            <Link
              id="tour-nav-subscriptions"
              href="/dashboard/subscriptions"
              className={getLinkStyles("/dashboard/subscriptions").className}
              onClick={() => setMobileOpen(false)}>
              <CreditCard
                size={17}
                className={getLinkStyles("/dashboard/subscriptions").iconColor}
              />
              Subscriptions
            </Link>

            <Link
              id="tour-nav-payments"
              href="/dashboard/payments"
              className={getLinkStyles("/dashboard/payments").className}
              onClick={() => setMobileOpen(false)}>
              <HandCoins
                size={17}
                className={getLinkStyles("/dashboard/payments").iconColor}
              />
              Payments
            </Link>
          </nav>
        </div>

        {/* Bottom Settings & User Footer */}
        <div className="space-y-4 pt-4 border-t border-zinc-100 dark:border-[#1a2942]">
          <nav className="space-y-1">
            <Link
              id="tour-nav-settings"
              href="/dashboard/settings"
              className={getLinkStyles("/dashboard/settings").className}
              onClick={() => setMobileOpen(false)}>
              <Settings
                size={17}
                className={getLinkStyles("/dashboard/settings").iconColor}
              />
              Settings
            </Link>
            <Link
              id="tour-nav-docs"
              href="/docs"
              className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-zinc-500 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white transition-colors"
              onClick={() => setMobileOpen(false)}>
              <HelpCircle size={17} />
              API Docs
            </Link>
            <button
              type="button"
              onClick={() => {
                setMobileOpen(false);
                startOrbitProductTour();
              }}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg text-sm font-medium text-[#0F86EE] hover:bg-blue-50/60 dark:hover:bg-[#131f33] transition-colors cursor-pointer text-left">
              <Sparkles size={17} />
              <span>Product Tour</span>
            </button>
          </nav>

          <div className="pt-3 border-t border-zinc-100 dark:border-[#1a2942] flex items-center justify-between">
            <div className="flex items-center gap-2.5 min-w-0">
              {userProfile?.avatarUrl ? (
                <Image
                  src={userProfile?.avatarUrl}
                  alt={userFullName}
                  className="w-8 h-8 rounded-full object-cover shrink-0"
                  width={32}
                  height={32}
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#0F86EE] text-white font-bold flex items-center justify-center text-xs shrink-0">
                  {`${userProfile.firstName?.[0] || ""}${userProfile.lastName?.[0] || ""}`.toUpperCase() ||
                    "U"}
                </div>
              )}

              <div className="flex flex-col text-left overflow-hidden">
                <span className="text-xs font-bold text-zinc-900 dark:text-white leading-none truncate max-w-28">
                  {userFullName.trim() || "Merchant"}
                </span>
                <span className="text-[10px] text-zinc-400 dark:text-zinc-500 mt-1 truncate max-w-28">
                  {userProfile.email}
                </span>
              </div>
            </div>

            <button
              type="button"
              className="text-zinc-400 hover:text-rose-500 dark:hover:text-rose-400 cursor-pointer p-1.5 rounded-md hover:bg-zinc-100 dark:hover:bg-[#131f33] transition-colors shrink-0"
              onClick={() => {
                startTransition(async () => {
                  await logout();
                });
              }}
              title="Log out"
              aria-label="Log out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main Content Area with Mobile Topbar */}
      <div className="flex-1 flex flex-col h-full overflow-hidden">
        {/* Mobile Header Bar */}
        <header className="h-14 border-b border-zinc-200 dark:border-[#1a2942] bg-white dark:bg-[#09101d] px-4 flex items-center justify-between md:hidden shrink-0">
          <button
            onClick={() => setMobileOpen(true)}
            className="p-2 rounded-lg border border-zinc-200 dark:border-[#1a2942] text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-[#131f33] cursor-pointer"
            aria-label="Open menu">
            <Menu size={18} />
          </button>

          <Link href="/dashboard" className="flex items-center gap-2">
            <Image
              src="/orbit-light.svg"
              alt="Orbit Logo"
              width={80}
              height={18}
              className="w-auto h-5 block dark:hidden"
              priority
            />
            <Image
              src="/orbit-dark.svg"
              alt="Orbit Logo"
              width={80}
              height={18}
              className="w-auto h-5 hidden dark:block"
              priority
            />
          </Link>

          <div className="flex items-center gap-2">
            {userProfile?.avatarUrl ? (
              <Image
                src={userProfile.avatarUrl}
                alt={userFullName}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-[#1a2942]"
                width={32}
                height={32}
              />
            ) : organization?.logoUrl ? (
              <Image
                src={organization.logoUrl}
                alt={organization.name}
                className="w-8 h-8 rounded-full object-cover shrink-0 border border-zinc-200 dark:border-[#1a2942]"
                width={32}
                height={32}
              />
            ) : (
              <div className="w-8 h-8 rounded-full bg-[#0F86EE] text-white font-bold flex items-center justify-center text-xs">
                {getInitials(userFullName || organization?.name || "M")}
              </div>
            )}
          </div>
        </header>

        {/* Main Viewport */}
        <main className="flex-1 overflow-y-auto bg-white dark:bg-[#0B1320] p-4 sm:p-6 md:p-8 text-left">
          {children}
        </main>
      </div>

      {/* Driver.js Product Tour */}
      <ProductTour />
    </div>
  );
}
