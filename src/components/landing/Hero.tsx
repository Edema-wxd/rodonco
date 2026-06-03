import Image from "next/image";
import Link from "next/link";

export function Hero() {
  return (
    <section className="bg-stone-100 overflow-hidden">
      <div className="mx-auto max-w-7xl px-8 pt-8 pb-0 lg:pt-28">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:gap-8 items-start">
          {/* Left — text content */}
          <div className="flex flex-col items-center sm:items-start gap-8 pt-0 sm:pt-8">
            {/* Badge */}
            <div
              className="flex items-center gap-2 rounded-full bg-green-300 px-4 py-1.5 justify-center sm:justify-start transition-transform duration-700 ease-in-out animate-bounce-in"
              style={{
                animation: "badge-bounce-in 1s cubic-bezier(0.23, 1, 0.32, 1) 0.05s"
              }}
            >
              <span
                className="h-2.5 w-2.5 rounded-full bg-green-900"
                style={{
                  animation: "badge-pulse 1.6s infinite cubic-bezier(0.4, 0, 0.6, 1)"
                }}
              />
              <span
                className="text-xs font-bold uppercase tracking-wider text-green-900"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                Freshly Prepped, Never Frozen
              </span>

            </div>
      

            {/* Headline */}
            <h1
              className="text-6xl font-bold leading-[1.05] text-zinc-800 lg:text-7xl"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Your demure
              <br />
              <span className="text-red-600">kitchen</span> assistant
            </h1>

            {/* Subtext */}
            <p
              className="max-w-lg text-xl leading-8 text-stone-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Fresh ingredients, prepped your way, delivered ready to cook.
            </p>

            {/* CTAs */}
            <div className="flex flex-wrap items-center gap-4 pt-2 justify-center sm:justify-start w-full">
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

          {/* Right — hero image */}
          <div className="relative flex justify-center lg:justify-end pb-20">
            {/* Rotated shadow box */}
            <div className="absolute inset-0 -rotate-2 rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] bg-red-700/5" />

            <Image
              src="https://placehold.co/584x584https://83e8y8wx7t.ufs.sh/f/qDzKWrcltWgcyr60UcFGq6g3dZQiKMa5pkVFlC10rzc9tfyE"
              alt="Freshly prepped meal kit"
              width={584}
              height={584}
              priority
              className="relative w-full max-w-[584px] rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] shadow-2xl object-cover"
              unoptimized
            />
          </div>
        </div>
      </div>
    </section>
  );
}
