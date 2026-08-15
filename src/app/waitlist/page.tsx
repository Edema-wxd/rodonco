import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import { Leaf, Sprout, ChefHat, Clock } from "lucide-react";

import { WaitlistForm } from "@/components/waitlist/WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist | rodo&co",
  description:
    "rodo&co is rolling out area by area. Join the waitlist and we'll tell you the moment we deliver fresh, chef-prepped meals to your neighbourhood.",
};

const PERKS = [
  { icon: Sprout, label: "Freshly prepped, never frozen" },
  { icon: ChefHat, label: "Chef-crafted sauces & kits" },
  { icon: Clock, label: "Cook in under 15 minutes" },
];

export default function WaitlistPage() {
  return (
    <main className="relative min-h-screen w-full overflow-hidden">
      {/* Background image + warm dark overlay */}
      <Image
        src="/images/hero2.png"
        alt=""
        fill
        priority
        unoptimized
        quality={100}
        sizes="100vw"
        className="object-cover"
      />
      <div className="absolute inset-0 bg-gradient-to-br from-black/85 via-black/60 to-black/35" />

      <div className="relative z-10 mx-auto flex min-h-screen max-w-7xl flex-col px-6 py-7 sm:px-8 lg:px-10">
        {/* ── Top bar ── */}
        <header className="flex items-center justify-between">
          <Link
            href="/"
            className="inline-flex items-center rounded-full bg-white/95 px-3 py-1.5 shadow-sm backdrop-blur"
            aria-label="rodo&co home"
          >
            <Image src="/logo.svg" alt="rodo&co" width={104} height={30} className="h-7 w-auto" />
          </Link>
          <Link
            href="/shop"
            className="text-sm font-medium text-white/80 underline-offset-4 transition-colors hover:text-white hover:underline"
          >
            View the menu →
          </Link>
        </header>

        {/* ── Main ── */}
        <div className="grid flex-1 items-center gap-10 py-10 lg:grid-cols-[1.1fr_minmax(360px,440px)] lg:gap-16">
          {/* Left: brand copy */}
          <div className="flex flex-col items-start gap-6 text-white">
            <div className="inline-flex items-center gap-2 rounded-full bg-[#d0f1c3] px-4 py-1.5">
              <Leaf className="h-3.5 w-3.5 text-green-900" aria-hidden="true" />
              <span className="text-xs font-bold uppercase tracking-wider text-green-900">
                Expanding, area by area
              </span>
            </div>

            <h1 className="max-w-2xl text-4xl font-bold leading-[1.1] sm:text-5xl lg:text-6xl">
              Good food is headed <span className="text-[#ec2d01]">your way</span>.
            </h1>

            <p className="max-w-lg text-lg text-stone-100/90">
              We&apos;re rolling rodo&amp;co out neighbourhood by neighbourhood. Join the waitlist
              and tell us where you live — we&apos;ll email you the moment we&apos;re delivering
              to your doorstep.
            </p>

            <ul className="flex flex-col gap-3 pt-1">
              {PERKS.map((perk) => {
                const Icon = perk.icon;
                return (
                  <li key={perk.label} className="flex items-center gap-3 text-stone-100">
                    <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-white/10 ring-1 ring-white/20">
                      <Icon className="h-4 w-4" aria-hidden="true" />
                    </span>
                    <span className="text-sm font-medium sm:text-base">{perk.label}</span>
                  </li>
                );
              })}
            </ul>
          </div>

          {/* Right: form card */}
          <div className="w-full rounded-3xl border border-white/10 bg-card p-6 shadow-2xl sm:p-8">
            <div className="mb-5">
              <h2 className="font-bold text-2xl text-foreground">Join the waitlist</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                Be first through the door when we launch near you.
              </p>
            </div>
            <WaitlistForm />
          </div>
        </div>

        {/* ── Footer ── */}
        <footer className="pt-4 text-xs text-white/60">
          © {new Date().getFullYear()} rodo&amp;co — Freshly prepped, never frozen.
        </footer>
      </div>
    </main>
  );
}
