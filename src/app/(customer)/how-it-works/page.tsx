import Link from "next/link";

const steps = [
  {
    number: "01",
    color: "text-red-700",
    title: "Browse this week’s menu",
    description:
      "Open the Menu and pick fresh produce and cooking kits for your week. Tap any item to view details.",
    accent: "bg-red-700",
  },
  {
    number: "02",
    color: "text-green-800",
    title: "Choose options in the drawer",
    description:
      "Click “Add to Order” to open the sidebar. Select size (for kits), prep option (for produce), and quantity—no page reload.",
    accent: "bg-green-800",
  },
  {
    number: "03",
    color: "text-red-400",
    title: "Checkout in minutes",
    description:
      "Review your cart, add delivery details, and pay via Paystack (card or bank transfer). No account required.",
    accent: "bg-red-400",
  },
  {
    number: "04",
    color: "text-green-800",
    title: "Saturday delivery",
    description:
      "Orders are delivered weekly on Saturday. Ordering is open Sun–Thu only; when ordering closes you can still browse the menu.",
    accent: "bg-green-800",
  },
] as const;

const faqs = [
  {
    q: "When can I place an order?",
    a: "Ordering is open Sunday through Thursday. After the weekly cutoff, ordering closes until the next window.",
  },
  {
    q: "Can I still browse when ordering is closed?",
    a: "Yes — you can browse products anytime. When ordering is closed, adding items is disabled and you’ll see a banner.",
  },
  {
    q: "Do I need an account?",
    a: "No. Checkout is account-free — name, phone, email, and address are collected at checkout.",
  },
  {
    q: "How do kits vs produce work?",
    a: "Cooking kits may have size options; fresh produce is sold per portion and may include optional prep styles (e.g., sliced, diced).",
  },
] as const;

export default function HowItWorksPage() {
  return (
    <div className="bg-stone-100">
      {/* Hero */}
      <section className="overflow-hidden bg-stone-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mx-auto max-w-3xl text-center">
            <p
              className="inline-flex items-center rounded-full bg-green-300 px-4 py-1.5 text-xs font-bold uppercase tracking-wider text-green-900"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Ordering, simplified
            </p>
            <h1
              className="mt-6 text-5xl font-black text-zinc-800 sm:text-6xl"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              How ordering works
            </h1>
            <p
              className="mt-4 text-base leading-6 text-stone-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              From menu to doorstep: select items, choose options in the sidebar, checkout, then receive your delivery on Saturday.
            </p>

            <div className="mt-10 flex flex-wrap justify-center gap-4">
              <Link
                href="/shop"
                className="relative inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-opacity hover:opacity-90"
              >
                <span
                  className="text-lg font-bold text-rose-50"
                  style={{ fontFamily: "var(--font-quicksand)" }}
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
                  style={{ fontFamily: "var(--font-quicksand)" }}
                >
                  Back to home
                </span>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Steps */}
      <section className="overflow-hidden bg-stone-100 pb-24 sm:pb-28">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-14 flex flex-col gap-4">
            <h2
              className="text-4xl font-black uppercase text-zinc-800"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              The flow, <span className="text-green-800">step-by-step.</span>
            </h2>
            <p
              className="max-w-2xl text-base leading-6 text-stone-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              We keep it fast: browse → drawer → checkout. The sidebar is where you pick sizes, prep options, and quantity.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {steps.map((step, i) => (
              <div
                key={step.number}
                className="relative rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-white p-10 shadow-sm outline outline-1 outline-white/50"
              >
                <span
                  className={`text-6xl font-black leading-none opacity-20 ${step.color}`}
                  style={{ fontFamily: "var(--font-quicksand)" }}
                >
                  {step.number}
                </span>
                <h3
                  className="mt-10 text-2xl font-bold text-zinc-800"
                  style={{ fontFamily: "var(--font-quicksand)" }}
                >
                  {step.title}
                </h3>
                <p
                  className="mt-4 text-base leading-6 text-stone-600"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {step.description}
                </p>

                <div className="mt-10 flex items-center gap-2">
                  {steps.map((_, j) => (
                    <div
                      key={j}
                      className={[
                        "rounded-full",
                        j === i ? `h-1 w-12 ${step.accent}` : "h-1 w-4 bg-stone-200",
                      ].join(" ")}
                    />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="bg-stone-100 pb-24 sm:pb-28">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-10">
            <h2
              className="text-4xl font-black uppercase text-zinc-800"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Quick <span className="text-red-700">FAQs</span>
            </h2>
            <p
              className="mt-3 max-w-2xl text-base leading-6 text-stone-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              The essentials for the weekly ordering cadence.
            </p>
          </div>

          <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
            {faqs.map((f) => (
              <div
                key={f.q}
                className="rounded-[32px] bg-white p-8 outline outline-1 outline-stone-200/50"
              >
                <h3
                  className="text-lg font-bold text-zinc-800"
                  style={{ fontFamily: "var(--font-quicksand)" }}
                >
                  {f.q}
                </h3>
                <p
                  className="mt-3 text-sm leading-6 text-stone-600"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {f.a}
                </p>
              </div>
            ))}
          </div>

          <div className="mt-14 flex justify-center">
            <Link
              href="/shop"
              className="border-b-2 border-red-700 pb-0.5 text-sm font-black uppercase tracking-wider text-red-700"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Start ordering
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

