"use client";

import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useCartUiStore } from "@/store/cartUi";
import { useHasHydrated } from "@/hooks/useHasHydrated";

export function Navbar() {
  const hasHydrated = useHasHydrated();
  const itemCount = useCartStore((s) => s.items.length);
  const openCart = useCartUiStore((s) => s.openCart);

  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur-sm">
      <nav className="mx-auto flex h-[4.5rem] max-w-7xl items-center justify-between px-4 sm:px-6">
        <Link
          href="/"
          className="font-heading text-2xl italic tracking-tight text-foreground hover:text-primary transition-colors"
        >
          Rodo &amp; Co
        </Link>

        <div className="flex items-center gap-7">
          <Link
            href="/shop"
            className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Shop
          </Link>

          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full hover:bg-secondary transition-colors"
            aria-label="Open cart"
            onClick={openCart}
          >
            <ShoppingCart className="h-[1.125rem] w-[1.125rem] text-foreground" />
            {hasHydrated && itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
                {itemCount}
              </span>
            )}
          </button>
        </div>
      </nav>
    </header>
  );
}
