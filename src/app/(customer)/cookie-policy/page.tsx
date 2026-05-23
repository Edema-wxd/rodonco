import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Cookie Policy | Rodo & Co",
};

export default function CookiePolicyPage() {
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
            Cookie Policy
          </h1>

          {/* Intro */}
          <p
            className="mt-6 max-w-2xl text-base leading-7 text-stone-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            {/* PLACEHOLDER: Legal copy is a client deliverable. Content below is a structural placeholder only. */}
            This Cookie Policy explains what cookies Rodo &amp; Co uses and why. By continuing to
            use our site, you consent to the use of cookies described here.
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
                What Are Cookies?
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                Cookies are small text files stored on your device when you visit a website. They
                help us remember your preferences and maintain your shopping session.
              </p>
            </div>

            {/* Card 2 */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                Cookies We Use
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                We use essential session cookies to maintain your cart and authentication state.
                We do not use advertising or tracking cookies.
              </p>
            </div>

            {/* Card 3 */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                Managing Cookies
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                You can disable cookies in your browser settings. Note that disabling essential
                cookies may affect your ability to add items to your cart or complete an order.
              </p>
            </div>

            {/* Card 4 */}
            <div className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-stone-200/60">
              <h3
                className="text-2xl font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                Contact
              </h3>
              <p
                className="mt-4 text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {/* PLACEHOLDER — client to supply */}
                If you have questions about our use of cookies, email us at hello@rodoco.ng. Full
                details to be confirmed by client.
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
