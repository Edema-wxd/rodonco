import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-stone-100 overflow-hidden">
      <div className="mx-auto max-w-7xl px-8 pt-24 pb-0 lg:pt-28">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-8 items-start">
          {/* Left — text content */}
          <div className="flex flex-col items-start gap-8 pt-8">
            {/* Badge */}
            <div className="flex items-center gap-2 rounded-full bg-green-300 px-4 py-1.5">
              <span className="h-2.5 w-2.5 rounded-full bg-green-900" />
              <span
                className="text-xs font-bold uppercase tracking-wider text-green-900"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Freshly Prepped, Never Frozen
              </span>
            </div>

            {/* Headline */}
            <h1
              className="text-6xl font-bold leading-[1.05] text-zinc-800 lg:text-7xl"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Buying back
              <br />
              <span className="text-red-600">your</span> time.
            </h1>

            {/* Subtext */}
            <p
              className="max-w-lg text-xl leading-8 text-stone-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Premium prepped ingredients and chef-crafted sauces delivered to
              your door. From stovetop to table in under 15 minutes.
              Nigeria&apos;s first high-fidelity meal prep experience.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2">
              <Link
                href="/shop"
                className="relative inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-opacity hover:opacity-90"
              >
                <span
                  className="text-lg font-bold text-rose-50"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  View This Week&apos;s Kits
                </span>
              </Link>
              <Link
                href="/how-it-works"
                className="inline-flex items-center justify-center rounded-full bg-stone-200 px-10 py-5 transition-colors hover:bg-stone-300"
              >
                <span
                  className="text-lg font-bold text-zinc-800"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  How it Works
                </span>
              </Link>
            </div>
          </div>

          {/* Right — hero image */}
          <div className="relative flex justify-center lg:justify-end pb-20">
            {/* Rotated shadow box */}
            <div className="absolute inset-0 -rotate-2 rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-red-700/5" />

            <Image
              src="https://placehold.co/584x584"
              alt="Freshly prepped meal kit"
              width={584}
              height={584}
              className="relative w-full max-w-[584px] rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] shadow-2xl object-cover"
              unoptimized
            />

            {/* Floating feature card */}
            <div className="absolute -left-6 bottom-4 max-w-[18rem] rounded-2xl bg-white p-6 shadow-xl outline outline-1 outline-stone-200">
              <div className="flex items-center gap-3">
                <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-green-800">
                  <svg
                    className="h-5 w-5 text-white"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" />
                    <path
                      fillRule="evenodd"
                      d="M4 5a2 2 0 012-2 3 3 0 003 3h2a3 3 0 003-3 2 2 0 012 2v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5zm3 4a1 1 0 000 2h.01a1 1 0 100-2H7zm3 0a1 1 0 000 2h3a1 1 0 100-2h-3zm-3 4a1 1 0 100 2h.01a1 1 0 100-2H7zm3 0a1 1 0 100 2h3a1 1 0 100-2h-3z"
                      clipRule="evenodd"
                    />
                  </svg>
                </div>
                <span
                  className="text-sm font-bold text-zinc-800"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  15-Minute Meals
                </span>
              </div>
              <p
                className="mt-2 text-xs leading-5 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Chef-level dinner without the supermarket stress or the prep
                mess.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
