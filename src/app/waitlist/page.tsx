import type { Metadata } from "next";
import Image from "next/image";
import { Leaf } from "lucide-react";

import { HeroBackground } from "@/components/landing/HeroBackground";
import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist | rodo&co",
  description:
    "rodo&co is rolling out neighbourhood by neighbourhood. Tell us where you live and we'll email you the day we're delivering fresh, ready-to-cook dinners to your door.",
};

// ── Signature: a rotating "produce seal", stamped on the form card ─────────────
function ProduceSeal() {
  return (
    <div className="relative h-[5.5rem] w-[5.5rem] drop-shadow-[0_10px_20px_rgba(0,0,0,0.35)] sm:h-24 sm:w-24">
      <svg viewBox="0 0 120 120" className="animate-seal h-full w-full" aria-hidden="true">
        <circle cx="60" cy="60" r="58" fill="#FBFAF7" />
        <circle cx="60" cy="60" r="58" fill="none" stroke="#166534" strokeWidth="1.5" />
        <circle cx="60" cy="60" r="49" fill="none" stroke="#166534" strokeOpacity="0.28" strokeWidth="1" />
        <defs>
          <path id="wl-seal-path" d="M60,60 m-41,0 a41,41 0 1,1 82,0 a41,41 0 1,1 -82,0" />
        </defs>
        <text
          fill="#166534"
          fontSize="8.6"
          fontWeight="700"
          letterSpacing="2.4"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          <textPath href="#wl-seal-path" startOffset="0" textLength="252" lengthAdjust="spacing">
            FRESHLY PREPPED · NEVER FROZEN ·
          </textPath>
        </text>
      </svg>
      <span className="absolute inset-0 grid place-items-center">
        <Leaf className="h-5 w-5 text-red-600 sm:h-6 sm:w-6" aria-hidden="true" />
      </span>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#171310] text-white">
      {/* Rotating full-bleed food imagery (same crossfade as the landing hero) */}
      <HeroBackground />

      {/* Legibility overlays: darken toward the bottom, and toward the content side */}
      <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/50 to-black/25" />
      <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-black/55 via-black/10 to-transparent" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        {/* ── Top bar (logo only — not a link; ordering isn't open yet) ── */}
        <header className="flex items-center">
          <span className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur">
            <Image src="/logo.svg" alt="rodo&co" width={104} height={30} className="h-7 w-auto" priority />
          </span>
        </header>

        {/* ── Hero ── */}
        <div className="grid flex-1 items-center gap-12 py-12 lg:grid-cols-[1.05fr_minmax(380px,460px)] lg:gap-16">
          {/* Left: message */}
          <div className="flex flex-col items-start">
            <div
              className="waitlist-rise inline-flex items-center gap-2 rounded-full bg-[#d0f1c3] px-3.5 py-1.5"
              style={{ animationDelay: "0.02s" }}
            >
              <Leaf className="h-3.5 w-3.5 text-green-900" aria-hidden="true" />
              <span className="text-[11px] font-bold uppercase tracking-[0.14em] text-green-900">
                The waitlist is open
              </span>
            </div>

            <h1
              className="waitlist-rise mt-5 max-w-xl text-[2.6rem] leading-[1.03] tracking-[-0.02em] drop-shadow-[0_2px_16px_rgba(0,0,0,0.35)] sm:text-6xl"
              style={{ animationDelay: "0.09s" }}
            >
              <span className="font-light text-white/85">Your kitchen assistant</span>
              <br />
              <span className="font-bold text-white">
                is <span className="text-[#ff5a2c]">on the way.</span>
              </span>
            </h1>

            <p
              className="waitlist-rise mt-5 max-w-md text-[15px] leading-relaxed text-stone-100/90 drop-shadow-[0_1px_10px_rgba(0,0,0,0.4)] sm:text-base"
              style={{ animationDelay: "0.16s" }}
            >
              We deliver freshly prepped ingredients and ready-to-cook kits — dinner on the table
              in 15 minutes. Tell us where you live and we&apos;ll email you the day rodo&amp;co
              reaches your door.
            </p>

            <p
              className="waitlist-rise mt-8 text-xs font-semibold uppercase tracking-[0.12em] text-white/70"
              style={{ animationDelay: "0.24s" }}
            >
              Freshly prepped&nbsp;·&nbsp;Ready-to-cook kits&nbsp;·&nbsp;15-minute dinners
            </p>
          </div>

          {/* Right: form card with the seal stamped on its corner */}
          <div className="waitlist-rise relative w-full" style={{ animationDelay: "0.14s" }}>
            <div className="absolute -right-2 -top-7 z-20 sm:-right-4 sm:-top-8">
              <ProduceSeal />
            </div>
            <WaitlistForm />
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-white/15 pt-5 text-xs text-white/60">
          <span>© {new Date().getFullYear()} rodo&amp;co</span>
          <span className="font-medium uppercase tracking-[0.12em]">Freshly prepped, never frozen</span>
        </footer>
      </div>
    </main>
  );
}
