"use client";

import { useState, useEffect } from "react";
import { Search, X } from "lucide-react";
import type { ActiveProductWithStartingPrice } from "@/lib/shop/products";
import { ProductCard } from "@/components/shop/ProductCard";

const sections = [
  { id: "fresh-produce", label: "Fresh Produce", accent: "text-green-800" },
  { id: "cooking-kits", label: "Cooking Kits", accent: "text-red-700" },
] as const;

function filterProducts(
  products: ActiveProductWithStartingPrice[],
  query: string
) {
  if (!query.trim()) return products;
  const q = query.toLowerCase();
  return products.filter(
    (p) =>
      p.name.toLowerCase().includes(q) ||
      p.description?.toLowerCase().includes(q)
  );
}

export function ShopContent({
  freshProduce,
  cookingKits,
}: {
  freshProduce: ActiveProductWithStartingPrice[];
  cookingKits: ActiveProductWithStartingPrice[];
}) {
  const [query, setQuery] = useState("");
  const [activeSection, setActiveSection] = useState<string>("fresh-produce");

  const filteredFresh = filterProducts(freshProduce, query);
  const filteredKits = filterProducts(cookingKits, query);
  const isSearching = query.trim().length > 0;
  const hasAnyResults = filteredFresh.length > 0 || filteredKits.length > 0;

  // Track active section based on scroll position
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    sections.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (!el) return;
      const observer = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveSection(id);
        },
        { rootMargin: "-30% 0px -60% 0px" }
      );
      observer.observe(el);
      observers.push(observer);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, []);

  const scrollTo = (id: string) => {
    document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <div className="flex gap-12 lg:gap-16">
      {/* ── Sticky sidebar (desktop) ── */}
      <aside className="hidden lg:flex w-44 shrink-0 flex-col">
        <div className="sticky top-28 flex flex-col gap-1">
          <p
            className="mb-3 text-[10px] font-bold uppercase tracking-widest text-stone-400"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            Browse
          </p>
          {sections.map(({ id, label }) => (
            <button
              key={id}
              type="button"
              onClick={() => scrollTo(id)}
              className={[
                "group flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold transition-all",
                activeSection === id && !isSearching
                  ? "bg-white text-zinc-800 shadow-sm"
                  : "text-stone-500 hover:text-zinc-800",
              ].join(" ")}
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              <span
                className={[
                  "h-1.5 w-1.5 shrink-0 rounded-full transition-colors",
                  activeSection === id && !isSearching
                    ? "bg-red-600"
                    : "bg-stone-300 group-hover:bg-stone-400",
                ].join(" ")}
              />
              {label}
            </button>
          ))}
        </div>
      </aside>

      {/* ── Main content ── */}
      <div className="min-w-0 flex-1">
        {/* Search bar */}
        <div className="relative mb-8">
          <Search className="pointer-events-none absolute left-4 top-1/2 h-4 w-4 -translate-y-1/2 text-stone-400" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="What are we prepping today?"
            className="w-full rounded-full border border-stone-200 bg-white py-3.5 pl-11 pr-10 text-sm text-zinc-800 outline-none placeholder:text-stone-400 focus:border-stone-400 focus:ring-0"
            style={{ fontFamily: "var(--font-inter)" }}
          />
          {query && (
            <button
              type="button"
              onClick={() => setQuery("")}
              className="absolute right-4 top-1/2 -translate-y-1/2 text-stone-400 hover:text-zinc-600"
              aria-label="Clear search"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Mobile section tabs */}
        {!isSearching && (
          <div className="mb-8 flex gap-6 overflow-x-auto lg:hidden">
            {sections.map(({ id, label }) => (
              <button
                key={id}
                type="button"
                onClick={() => scrollTo(id)}
                className={[
                  "shrink-0 pb-1 text-sm font-bold transition-colors",
                  activeSection === id
                    ? "border-b-2 border-red-600 text-red-600"
                    : "text-stone-500",
                ].join(" ")}
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                {label}
              </button>
            ))}
          </div>
        )}

        {/* No results */}
        {isSearching && !hasAnyResults && (
          <p
            className="text-sm text-stone-500"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            That&apos;s not on the menu yet.
          </p>
        )}

        {/* Product sections */}
        <div className="space-y-20">
          {(!isSearching || filteredFresh.length > 0) && (
            <section id="fresh-produce">
              <div className="pb-6">
                <h2
                  className="text-4xl font-black uppercase leading-10 text-zinc-800"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  Fresh{" "}
                  <span className="text-green-800">Produce</span>
                </h2>
                <p
                  className="mt-2 text-sm text-stone-600"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {filteredFresh.length} items
                </p>
              </div>
              {filteredFresh.length ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredFresh.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      startingPriceNgn={product.starting_price_ngn}
                    />
                  ))}
                </div>
              ) : (
                <p
                  className="text-sm text-stone-500"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  No products available yet.
                </p>
              )}
            </section>
          )}

          {(!isSearching || filteredKits.length > 0) && (
            <section id="cooking-kits">
              <div className="pb-6">
                <h2
                  className="text-4xl font-black uppercase leading-10 text-zinc-800"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  Cooking{" "}
                  <span className="text-red-700">Kits</span>
                </h2>
                <p
                  className="mt-2 text-sm text-stone-600"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {filteredKits.length} items
                </p>
              </div>
              {filteredKits.length ? (
                <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 xl:grid-cols-3">
                  {filteredKits.map((product) => (
                    <ProductCard
                      key={product.id}
                      product={product}
                      startingPriceNgn={product.starting_price_ngn}
                    />
                  ))}
                </div>
              ) : (
                <p
                  className="text-sm text-stone-500"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  No products available yet.
                </p>
              )}
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
