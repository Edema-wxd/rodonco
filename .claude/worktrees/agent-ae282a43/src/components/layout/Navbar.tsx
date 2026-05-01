"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useHasHydrated } from "@/hooks/useHasHydrated";

export function Navbar() {
  const hasHydrated = useHasHydrated();
  const itemCount = useCartStore((s) => s.items.length);

  return (
    <header className="sticky top-0 z-50 border-b bg-white">
      <nav className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-xl font-bold">
          Rodo &amp; Co
        </Link>

        <div className="flex items-center gap-6">
          <Link href="/shop" className="text-sm font-medium hover:underline">
            Shop
          </Link>

          <Link href="/checkout" className="relative" aria-label="Cart">
            <ShoppingCart className="h-5 w-5" />
            {hasHydrated && itemCount > 0 && (
              <span className="absolute -right-2 -top-2 flex h-4 w-4 items-center justify-center rounded-full bg-black text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </Link>
        </div>
      </nav>
    </header>
  );
}
