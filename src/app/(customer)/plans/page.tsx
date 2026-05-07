import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Plans | Rodo & Co",
};

export default function PlansPage() {
  return (
    <div className="bg-stone-100">
      {/* Hero */}
      <section className="overflow-hidden bg-stone-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-3xl text-center">
            {/* Badge */}
            <p
              className="inline-flex items-center rounded-full bg-green-300 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-900"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Weekly ordering
            </p>

            {/* H1 */}
            <h1
              className="mt-6 text-5xl font-black text-zinc-800 sm:text-6xl"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              How Our Plans Work
            </h1>

            {/* Subheadline */}
            <p
              className="mt-4 text-base leading-6 text-stone-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {/* PLACEHOLDER: Pricing and plan details are a client deliverable. */}
              Order fresh produce and cooking kits for the week — delivered every Saturday.
              Browse the menu, add to your order, and pay at checkout. No subscription required.
            </p>

            {/* CTAs */}
            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/shop"
                className="relative inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-opacity hover:opacity-90"
              >
                <span
                  className="text-lg font-bold text-rose-50"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  Browse the menu
                </span>
              </Link>
              <Link
                href="/"
                className="inline-flex items-center justify-center rounded-full bg-stone-200 px-10 py-5 transition-colors hover:bg-stone-300"
              >
                <span
                  className="text-lg font-bold text-zinc-800"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  Back to home
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Plan tiers */}
      <section className="overflow-hidden bg-stone-100 pb-24 sm:pb-28">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-14">
            <h2
              className="text-4xl font-black uppercase text-zinc-800"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Weekly ordering, <span className="text-green-800">simplified.</span>
            </h2>
            <p
              className="mt-4 max-w-2xl text-base leading-6 text-stone-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {/* PLACEHOLDER — client to supply pricing details */}
              Pick what you need each week — no recurring commitment. Ordering opens every
              Sunday and closes Thursday night for Saturday delivery.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Card 1 — Fresh Produce */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <p
                className="inline-flex items-center rounded-full bg-green-300 px-3 py-1 text-xs font-bold uppercase tracking-wider text-green-900"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Fresh Produce
              </p>
              <h3
                className="mt-6 text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Weekly Essentials
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply pricing */}
                Choose individual fresh produce items for the week. Select your preferred prep
                option (whole, sliced, or diced) and quantity. Priced per portion.
              </p>
              <p
                className="mt-6 text-3xl font-black text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                From ₦2,500
                <span
                  className="ml-2 text-sm font-normal text-stone-500"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  / item {/* PLACEHOLDER */}
                </span>
              </p>
            </div>

            {/* Card 2 — Cooking Kits */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <p
                className="inline-flex items-center rounded-full bg-red-100 px-3 py-1 text-xs font-bold uppercase tracking-wider text-red-700"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Cooking Kits
              </p>
              <h3
                className="mt-6 text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Ready-to-Cook Kits
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply pricing */}
                Pre-portioned cooking kits with everything you need for a recipe. Available in
                multiple sizes. Just cook, plate, and enjoy.
              </p>
              <p
                className="mt-6 text-3xl font-black text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                From ₦8,500
                <span
                  className="ml-2 text-sm font-normal text-stone-500"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  / kit {/* PLACEHOLDER */}
                </span>
              </p>
            </div>

            {/* Card 3 — How ordering works */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60 md:col-span-2">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                The ordering window
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply any additional detail */}
                Ordering opens every Sunday and closes Thursday at midnight. Once closed,
                the menu is still browsable but items cannot be added to your order until the
                next window opens. Delivery is every Saturday — fresh to your door.
              </p>
            </div>
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              href="/shop"
              className="border-b-2 border-red-700 pb-0.5 text-sm font-black uppercase tracking-wider text-red-700"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Browse this week&apos;s menu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
