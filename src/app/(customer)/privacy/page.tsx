import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Privacy Policy | Rodo & Co",
};

export default function PrivacyPage() {
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
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              ← Back to home
            </Link>
          </div>

          {/* Section label */}
          <p
            className="text-xs font-black uppercase tracking-wider text-red-600"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Legal
          </p>

          {/* H1 */}
          <h1
            className="mt-4 text-5xl font-black leading-[1.05] text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Privacy Policy
          </h1>

          {/* Intro */}
          <p
            className="mt-6 max-w-2xl text-base leading-7 text-stone-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {/* PLACEHOLDER: Legal copy is a client deliverable. Content below is a structural placeholder only. */}
            This Privacy Policy describes how Rodo &amp; Co collects, uses, and protects your
            personal information in accordance with the Nigeria Data Protection Regulation (NDPR).
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
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                Information We Collect
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                We collect your name, phone number, email address, and delivery address when you
                place an order. No payment card details are stored on our servers.
              </p>
            </div>

            {/* Card 2 */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                How We Use Your Data
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                Your data is used solely to process and fulfil your order and to send delivery
                confirmations. We do not sell or share your personal data with third parties.
              </p>
            </div>

            {/* Card 3 */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                Your Rights
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                Under the NDPR, you have the right to access, correct, or request deletion of your
                personal data. Contact us at hello@rodoco.ng to exercise these rights.
              </p>
            </div>

            {/* Card 4 */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                Cookies
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                We use essential cookies to maintain your shopping session. See our{" "}
                <Link href="/cookie-policy" className="underline text-red-700">
                  Cookie Policy
                </Link>{" "}
                for details.
              </p>
            </div>
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              href="/"
              className="border-b-2 border-red-700 pb-0.5 text-sm font-black uppercase tracking-wider text-red-700"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Back to home
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
