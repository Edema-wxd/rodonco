"use client";

import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useCartUiStore } from "@/store/cartUi";
import { useHasHydrated } from "@/hooks/useHasHydrated";

const navLinks = [
  { label: "Menu", href: "/shop" },
  { label: "Plans", href: "/plans" },
  { label: "How it Works", href: "/how-it-works" },
  { label: "Wall of Love", href: "/wall-of-love" },
] as const;

export function Navbar() {
  const hasHydrated = useHasHydrated();
  const itemCount = useCartStore((s) => s.items.length);
  const openCart = useCartUiStore((s) => s.openCart);

  return (
    <header className="sticky top-0 z-50 bg-white/70 backdrop-blur-md shadow-[0px_20px_25px_-5px_rgba(67,20,7,0.05)]">
      <nav className="mx-auto flex h-12 h-[55px] md:h-20 md:max-h-none max-w-7xl items-center justify-between px-8">
 
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <Image
            src="/logo.svg"
            alt="rodo&co"
            width={111}
            height={31}
            priority
            className="h-8 w-auto"
          />
        </Link>

        {/* Nav links */}
        <div className="hidden items-center gap-8 md:flex">
          {navLinks.map((link) => (
            <Link
              key={link.label}
              href={link.href}
              className="text-sm uppercase tracking-wider text-zinc-600 transition-colors hover:text-zinc-900"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              {link.label}
            </Link>
          ))}
        </div>

        {/* Actions */}
        <div className="flex items-center gap-4">
          {/* Cart */}
          <button
            type="button"
            className="relative flex h-9 w-9 items-center justify-center rounded-full transition-colors hover:bg-stone-100"
            aria-label="Open cart"
            onClick={openCart}
          >
            <ShoppingCart className="h-[1.125rem] w-[1.125rem] text-zinc-800" />
            {hasHydrated && itemCount > 0 && (
              <span className="absolute -right-1 -top-1 flex h-[1.125rem] w-[1.125rem] items-center justify-center rounded-full bg-red-600 text-[10px] font-bold text-white">
                {itemCount}
              </span>
            )}
          </button>


        </div>
      </nav>
    </header>
  );
}
