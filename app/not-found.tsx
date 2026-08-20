import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, Home } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-white flex flex-col justify-between items-center py-12 px-6 antialiased font-sans text-zinc-900">
      {/* Brand Header */}
      <div className="flex items-center gap-2 mt-4">
        <Image
          src="/orbit-light.svg"
          alt="Orbit"
          width={100}
          height={24}
          className="w-auto h-6"
          priority
        />
      </div>

      {/* Center 404 Container */}
      <div className="max-w-md w-full text-center flex flex-col items-center gap-6 my-auto">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-zinc-200 bg-zinc-50 text-xs font-semibold text-zinc-600">
          <span className="w-1.5 h-1.5 rounded-full bg-[#0F86EE]" />
          <span>Error 404</span>
        </div>

        <div className="space-y-2">
          <h1 className="text-3xl font-bold tracking-tight text-zinc-950">
            Page not found
          </h1>
          <p className="text-sm text-zinc-500 max-w-sm mx-auto leading-relaxed">
            The page you are looking for doesn&apos;t exist, is unavailable, or may have been moved.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center gap-3 w-full justify-center pt-2">
          <Link
            href="/dashboard"
            className="w-full sm:w-auto h-11 px-6 rounded-lg bg-[#0F86EE] hover:bg-[#0d7ad9] text-white font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer shadow-xs">
            <ArrowLeft size={15} />
            <span>Back to dashboard</span>
          </Link>

          <Link
            href="/dashboard/products"
            className="w-full sm:w-auto h-11 px-6 rounded-lg border border-zinc-200 hover:bg-zinc-50 text-zinc-700 font-semibold text-xs transition-colors flex items-center justify-center gap-2 cursor-pointer">
            <Home size={15} />
            <span>Products</span>
          </Link>
        </div>
      </div>

      {/* Footer */}
      <div className="text-xs text-zinc-400 pt-6">
        <span>Powered by Orbit Financial Infrastructure</span>
      </div>
    </div>
  );
}
