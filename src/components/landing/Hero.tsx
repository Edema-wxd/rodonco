import Link from "next/link";
import { Leaf } from "lucide-react";

import { HeroBackground } from "./HeroBackground";

export function Hero() {
  return (
    <section className="relative min-h-[640px] overflow-hidden lg:min-h-[760px]">
      <HeroBackground />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full min-h-[640px] max-w-7xl flex-col items-start justify-start gap-6 px-6 pt-10 sm:px-8 lg:min-h-[760px] lg:justify-center lg:gap-8 lg:pt-0">
        {/* Badge */}
        <div
          className="flex items-center gap-2 rounded-full bg-green-300 px-4 py-1.5 "
          style={{
            animation: "badge-bounce-in 1s cubic-bezier(0.23, 1, 0.32, 1) 0.05s",
          }}
        >
          <span
            className="h-2.5 w-2.5 rounded-full bg-green-300"
            style={{
              animation: "badge-pulse 1.6s infinite cubic-bezier(0.4, 0, 0.6, 1)",
            }}
          >
            <Leaf className="h-3 w-3" />
          </span>
          <span
            className="text-xs font-bold uppercase tracking-wider text-green-900"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Freshly Prepped, Never Frozen
          </span>
        </div>

        {/* Headline */}
        <h1
          className="max-w-2xl text-5xl font-bold leading-[1.05] text-white sm:text-6xl lg:text-7xl"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          <span className="text-red-400 lg:text-red-500">Your</span> demure
          kitchen assistant
        </h1>

        {/* Subtext */}
        <p
          className="max-w-lg text-lg leading-8 text-stone-100 sm:text-xl"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Fresh ingredients, prepped your way, delivered ready to cook.
        </p>

        {/* CTA */}
        <div className="flex flex-wrap items-center gap-4 pt-2">
          <Link
            href="/shop"
            className="relative inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-all duration-200 hover:-translate-y-1 hover:bg-red-500 hover:shadow-[0px_28px_32px_-5px_rgba(236,45,1,0.40)] active:translate-y-0 active:scale-[0.97] active:shadow-[0px_10px_15px_-5px_rgba(236,45,1,0.30)]"
          >
            <span
              className="text-lg font-bold text-rose-50"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Start Cooking
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
