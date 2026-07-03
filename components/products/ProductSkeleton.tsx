export default function ProductSkeleton() {
  return (
    <div className="rounded-3xl border border-zinc-200 p-8 animate-pulse">
      <div className="flex justify-between">
        <div className="flex gap-5">
          <div className="h-16 w-16 rounded-full bg-zinc-100" />

          <div className="space-y-3">
            <div className="h-4 w-40 bg-zinc-100 rounded" />
            <div className="h-3 w-60 bg-zinc-100 rounded" />
          </div>
        </div>

        <div className="h-6 w-20 bg-zinc-100 rounded-full" />
      </div>

      <div className="mt-6 h-10 w-full bg-zinc-100 rounded-xl" />

      <div className="mt-6 flex justify-end gap-3">
        <div className="h-10 w-10 bg-zinc-100 rounded-full" />
        <div className="h-10 w-10 bg-zinc-100 rounded-full" />
      </div>
    </div>
  );
}
