import Link from "next/link";
import { Leaf } from "lucide-react";

import { HeroBackground } from "./HeroBackground";

export function Hero() {
  return (
    <section className="relative min-h-[640px] overflow-hidden lg:min-h-[760px]">
      <HeroBackground />
      <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/15 to-transparent" />

      <div className="relative z-10 mx-auto flex h-full min-h-[640px] max-w-7xl flex-col justify-between py-6  px-8 lg:min-h-[760px] lg:py-0">
        {/* Top: Badge */}
        <div className="flex-1 flex items-start">
          <div
            className="flex w-full justify-center md:justify-start items-center gap-2 rounded-full bg-[#d0f1c3] px-4 py-1.5"
            style={{
              animation: "badge-bounce-in 1s cubic-bezier(0.23, 1, 0.32, 1) 0.05s",
            }}
          >
            <span
              className="h-2.5 w-2.5 rounded-full bg-[#d0f1c3]"
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
        </div>

        {/* Middle: Headline + Subtext */}
        <div className="flex-1 flex flex-col justify-start items-start gap-5">
          <h1
            className="max-w-2xl text-5xl font-bold text-white sm:text-6xl lg:text-7xl"
            style={{ fontFamily: "var(--font-quicksand)", lineHeight: "1.2" }}
          >
            <span className="text-[#ec2d01]">Your</span> demure
            kitchen assistant
          </h1>
          <p
            className="max-w-lg text-lg text-stone-100 sm:text-xl"
            style={{ fontFamily: "var(--font-inter)", lineHeight: "1.2" }}
          >
            Fresh ingredients, prepped your way, delivered ready to cook.
          </p>
        </div>

        {/* Bottom: CTA */}
        <div className="flex-1 flex items-start w-full">
          <div className="flex flex-wrap items-center justify-center md:justify-start gap-4 pt-2 w-full">
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
      </div>
 
    </section>
  );
}
