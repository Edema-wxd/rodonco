import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Terms of Service | Rodo & Co",
};

export default function TermsPage() {
  return (
    <div className="bg-stone-100">
      {/* Hero */}
      <section className="overflow-hidden bg-stone-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-8">
          {/* Back link */}
          <div className="mb-8">
            <Link
              href="/"
              className="text-sm font-black uppercase tracking-wider text-red-700"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              ← Back to home
            </Link>
          </div>

          {/* Section label */}
          <p
            className="text-xs font-black uppercase tracking-wider text-red-600"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            Legal
          </p>

          {/* H1 */}
          <h1
            className="mt-4 text-5xl font-black leading-[1.05] text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Terms of Service
          </h1>

          {/* Intro */}
          <p
            className="mt-6 max-w-2xl text-base leading-7 text-stone-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {/* PLACEHOLDER: Legal copy is a client deliverable. Content below is a structural placeholder only. */}
            By placing an order with Rodo &amp; Co you agree to these Terms of Service. Please
            read them carefully before completing your purchase.
          </p>
        </div>
      </section>

      {/* Content */}
      <section className="overflow-hidden bg-stone-100 pb-24 sm:pb-28">
        <div className="mx-auto max-w-7xl px-8">
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {/* Card 1 */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Orders &amp; Payments
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                Orders are placed for delivery on the following Saturday. Payment is processed
                securely via Paystack. All prices are in Nigerian Naira (₦).
              </p>
            </div>

            {/* Card 2 */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Cancellations &amp; Refunds
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                Orders may be cancelled before the weekly cutoff on Thursday at midnight. Refund
                policy details to be provided by client.
              </p>
            </div>

            {/* Card 3 */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Delivery
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                Deliveries are made every Saturday. The specific delivery window and service area
                details will be communicated at checkout.
              </p>
            </div>

            {/* Card 4 */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Contact
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                For questions about these terms, contact us at hello@rodoco.ng. Full legal entity
                details to be supplied by client.
              </p>
            </div>
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              href="/"
              className="border-b-2 border-red-700 pb-0.5 text-sm font-black uppercase tracking-wider text-red-700"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
