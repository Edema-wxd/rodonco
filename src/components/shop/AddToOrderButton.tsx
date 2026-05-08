"use client";

import { Suspense } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";

const buttonClassName =
  "w-full rounded-full bg-stone-100 py-3 text-center text-sm font-bold text-zinc-800 transition-colors hover:bg-stone-200 sm:py-4 sm:text-base";
const buttonFontStyle = { fontFamily: "var(--font-lexend)" } as const;

function AddToOrderButtonInner({ productId }: { productId: string }) {
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
      className={buttonClassName}
      style={buttonFontStyle}
    >
      Add to Order
    </button>
  );
}

function AddToOrderButtonFallback() {
  return (
    <button
      type="button"
      disabled
      aria-busy="true"
      className={buttonClassName}
      style={buttonFontStyle}
    >
      Add to Order
    </button>
  );
}

// Wraps in Suspense because useSearchParams() forces dynamic rendering
// unless it sits below a Suspense boundary (Next.js 15 prerender requirement).
export function AddToOrderButton({ productId }: { productId: string }) {
  return (
    <Suspense fallback={<AddToOrderButtonFallback />}>
      <AddToOrderButtonInner productId={productId} />
    </Suspense>
  );
}

