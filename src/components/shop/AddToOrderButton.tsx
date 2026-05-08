"use client";

import { usePathname, useRouter, useSearchParams } from "next/navigation";

export function AddToOrderButton({ productId }: { productId: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const open = () => {
    const next = new URLSearchParams(searchParams.toString());
    next.set("drawer", productId);

    const qs = next.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  };

  return (
    <button
      type="button"
      onClick={open}
      className="w-full rounded-full bg-stone-100 py-3 text-center text-sm font-bold text-zinc-800 transition-colors hover:bg-stone-200 sm:py-4 sm:text-base"
      style={{ fontFamily: "var(--font-lexend)" }}
    >
      Add to Order
    </button>
  );
}

