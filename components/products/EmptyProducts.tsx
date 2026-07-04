import Image from "next/image";

export default function EmptyProducts({ onCreate }: { onCreate: () => void }) {
  return (
    <div className="flex h-130 w-full items-center justify-center rounded-3xl border border-zinc-200">
      <div className="flex max-w-sm flex-col items-center">
        <Image src="/empty-illustration.svg" alt="" width={90} height={90} />

        <p className="mt-8 text-[18px] font-medium text-zinc-900">
          No products yet
        </p>

        <p className="mt-3 text-center text-[14px] leading-6 text-zinc-500">
          Create your first product to start selling subscriptions and managing
          customers
        </p>

        <button
          onClick={onCreate}
          className="mt-10 h-11 rounded-full border border-zinc-200 px-10 text-[14px] font-medium text-zinc-900 hover:bg-zinc-50 cursor-pointer">
          Create product
        </button>
      </div>
    </div>
  );
}
