import type { Metadata } from "next";
import Image from "next/image";
import { Leaf } from "lucide-react";

import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist | rodo&co",
  description:
    "rodo&co is rolling out neighbourhood by neighbourhood. Tell us where you live and we'll email you the day we're delivering fresh, chef-prepped dinners to your door.",
};

// ── Signature: a rotating "produce seal" stamped on the photo ──────────────────
function ProduceSeal() {
  return (
    <div className="relative h-28 w-28 drop-shadow-[0_10px_20px_rgba(41,37,36,0.25)] sm:h-32 sm:w-32">
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
        <Leaf className="h-6 w-6 text-red-600 sm:h-7 sm:w-7" aria-hidden="true" />
      </span>
    </div>
  );
}

export default function WaitlistPage() {
  return (
    <main className="relative min-h-screen overflow-hidden bg-[#F2F0EA] text-[#292524]">
      {/* Ambient warmth — disciplined, low-opacity brand blooms */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <div className="absolute -left-24 top-[-10%] h-[36rem] w-[36rem] rounded-full bg-[#166534]/[0.06] blur-3xl" />
        <div className="absolute -right-16 bottom-[-15%] h-[32rem] w-[32rem] rounded-full bg-[#EC2D01]/[0.05] blur-3xl" />
      </div>

      <div className="relative z-10 mx-auto flex min-h-screen max-w-6xl flex-col px-5 py-6 sm:px-8 sm:py-8">
        {/* ── Top bar (logo only — not a link; ordering isn't open yet) ── */}
        <header className="flex items-center">
          <Image src="/logo.svg" alt="rodo&co" width={104} height={30} className="h-7 w-auto" priority />
        </header>

        {/* ── Hero ── */}
        <div className="grid flex-1 items-center gap-10 py-12 lg:grid-cols-[1.05fr_0.95fr] lg:gap-16">
          {/* Left: message + form */}
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
              className="waitlist-rise mt-5 max-w-xl text-[2.6rem] leading-[1.02] tracking-[-0.02em] sm:text-6xl"
              style={{ animationDelay: "0.09s" }}
            >
              <span className="font-light text-stone-500">Your kitchen assistant</span>
              <br />
              <span className="font-bold text-[#292524]">
                is <span className="text-[#EC2D01]">on the way.</span>
              </span>
            </h1>

            <p
              className="waitlist-rise mt-5 max-w-md text-[15px] leading-relaxed text-stone-600 sm:text-base"
              style={{ animationDelay: "0.16s" }}
            >
              We deliver freshly prepped ingredients and ready-to-cook kits — dinner on the table
              in 15 minutes. Tell us where you live and we&apos;ll email you the day rodo&amp;co
              reaches your door.
            </p>

            <div className="waitlist-rise mt-8 w-full max-w-md" style={{ animationDelay: "0.23s" }}>
              <WaitlistForm />
            </div>

            <p
              className="waitlist-rise mt-6 text-xs font-medium uppercase tracking-[0.12em] text-stone-400"
              style={{ animationDelay: "0.3s" }}
            >
              Freshly prepped&nbsp;·&nbsp;Ready-to-cook kits&nbsp;·&nbsp;15-minute dinners
            </p>
          </div>

          {/* Right: appetite-forward photo + seal */}
          <div className="waitlist-rise relative" style={{ animationDelay: "0.14s" }}>
            {/* soft offset backing plate for depth */}
            <div className="absolute -right-3 -top-3 hidden h-full w-full rounded-[2.25rem] bg-[#166534]/10 lg:block" />
            <div className="relative aspect-[4/5] overflow-hidden rounded-[2rem] shadow-[0_30px_60px_-20px_rgba(41,37,36,0.35)] ring-1 ring-black/5 sm:aspect-[5/4] lg:aspect-[4/5]">
              <Image
                src="/images/hero2.png"
                alt="A freshly prepped rodo&co dish, ready to cook"
                fill
                priority
                unoptimized
                quality={100}
                sizes="(max-width: 1024px) 100vw, 45vw"
                className="object-cover"
              />
              {/* Signature seal, stuck to the photo */}
              <div className="absolute bottom-4 right-4 sm:bottom-5 sm:right-5">
                <ProduceSeal />
              </div>
            </div>
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="flex flex-wrap items-center justify-between gap-2 border-t border-stone-300/60 pt-5 text-xs text-stone-400">
          <span>© {new Date().getFullYear()} rodo&amp;co</span>
          <span className="font-medium uppercase tracking-[0.12em]">Freshly prepped, never frozen</span>
        </footer>
      </div>
    </main>
  );
}
