import Link from "next/link";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-zinc-50 flex items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="text-7xl font-black text-orbit-primary">404</div>

        <h1 className="mt-6 text-3xl font-bold text-zinc-900">
          Page not found
        </h1>

        <p className="mt-3 text-zinc-500">
          Sorry, the page you are looking for does not exist or may have been
          moved.
        </p>

        <Link
          href="/dashboard"
          className="inline-flex mt-8 rounded-full bg-orbit-primary px-6 py-3 text-white font-semibold">
          Back to dashboard
        </Link>
      </div>
    </div>
  );
}
