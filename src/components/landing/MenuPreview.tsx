import Image from "next/image";
import Link from "next/link";

const kits = [
  {
    title: "Home Alone Combo (Stir-fry)",
    price: "₦5,000",
    description: "Classic sliced burst of colors.",
    time: "15 Min",
    difficulty: "Easy",
    difficultyColor: "text-green-800",
    priceColor: "text-red-600",
  },
  {
    title: "Weekend Starter Pack (Akara/Moin-moin)",
    price: "₦3,000",
    description: "Thoroughly washed and peeled beans.",
    time: "12 Min",
    difficulty: "Easy",
    difficultyColor: "text-green-800",
    priceColor: "text-red-700",
  },
  {
    title: "Jollof Base / Stew Kit",
    price: "₦3,500",
    description: "Juicy tomatoes, rodo, tatashe and onions prepped to proportion.",
    time: "20 Min",
    difficulty: "Medium",
    difficultyColor: "text-green-800",
    priceColor: "text-red-700",
  },
] as const;

export function MenuPreview() {
  return (
    <section className="bg-stone-100 py-32">
      <div className="mx-auto max-w-7xl px-8">
        {/* Centered header */}
        <div className="mx-auto mb-16 max-w-2xl text-center">
          <h2
            className="text-5xl font-black text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Ready for the Pot
          </h2>
          <p
            className="mt-4 text-base leading-6 text-stone-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Check out our curated kits, prepped to make cooking easier.
          </p>
        </div>

        {/* Card grid - swipe on mobile, grid on md+ */}
        <div>
          {/* Mobile: horizontal swipe, hidden on md+ */}
          <div className="flex -mx-4 overflow-x-auto pb-2 md:hidden" style={{ WebkitOverflowScrolling: "touch" }}>
            {kits.map((kit) => (
              <div
                key={kit.title}
                className="min-w-[85vw] max-w-xs mx-4 shrink-0 overflow-hidden rounded-[32px] bg-white outline outline-1 outline-stone-200/50"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src="https://placehold.co/382x256"
                    alt={kit.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Badges */}
                  <div className="absolute left-4 top-4 flex gap-2">
                    <span
                      className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-red-700 backdrop-blur-sm"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {kit.time}
                    </span>
                    <span
                      className={`rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide backdrop-blur-sm ${kit.difficultyColor}`}
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {kit.difficulty}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-4 p-8">
                  <div className="flex items-start justify-between">
                    <h3
                      className="flex-1 pr-4 text-2xl font-bold leading-8 text-zinc-800"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {kit.title}
                    </h3>
                    <span
                      className={`text-xl font-bold ${kit.priceColor}`}
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {kit.price}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-5 text-stone-600"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {kit.description}
                  </p>
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-full bg-stone-100 py-4 text-base font-bold text-zinc-800 transition-all duration-150 hover:bg-red-600 hover:text-white active:scale-[0.97] active:bg-red-700"
                    style={{ fontFamily: "var(--font-quicksand)" }}
                  >
                    Add to Box
                  </button>
                </div>
              </div>
            ))}
          </div>
          {/* Desktop: normal grid, hidden on mobile */}
          <div className="hidden md:grid grid-cols-3 gap-6">
            {kits.map((kit) => (
              <div
                key={kit.title}
                className="overflow-hidden rounded-[32px] bg-white outline outline-1 outline-stone-200/50"
              >
                {/* Image */}
                <div className="relative h-64 overflow-hidden">
                  <Image
                    src="https://placehold.co/382x256"
                    alt={kit.title}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                  {/* Badges */}
                  <div className="absolute left-4 top-4 flex gap-2">
                    <span
                      className="rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide text-red-700 backdrop-blur-sm"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {kit.time}
                    </span>
                    <span
                      className={`rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide backdrop-blur-sm ${kit.difficultyColor}`}
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {kit.difficulty}
                    </span>
                  </div>
                </div>

                {/* Content */}
                <div className="flex flex-col gap-4 p-8">
                  <div className="flex items-start justify-between">
                    <h3
                      className="flex-1 pr-4 text-2xl font-bold leading-8 text-zinc-800"
                      style={{ fontFamily: "var(--font-quicksand)" }}
                    >
                      {kit.title}
                    </h3>
                    <span
                      className={`text-xl font-bold ${kit.priceColor}`}
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {kit.price}
                    </span>
                  </div>
                  <p
                    className="text-sm leading-5 text-stone-600"
                    style={{ fontFamily: "var(--font-inter)" }}
                  >
                    {kit.description}
                  </p>
                  <button
                    type="button"
                    className="w-full cursor-pointer rounded-full bg-stone-100 py-4 text-base font-bold text-zinc-800 transition-all duration-150 hover:bg-red-600 hover:text-white active:scale-[0.97] active:bg-red-700"
                    style={{ fontFamily: "var(--font-quicksand)" }}
                  >
                    Add to Box
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
 

        {/* CTA */}
        <div className="mt-16 flex justify-center">
          <Link
            href="/shop"
            className="inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-all duration-200 hover:-translate-y-1 hover:bg-red-500 hover:shadow-[0px_28px_32px_-5px_rgba(236,45,1,0.40)] active:translate-y-0 active:scale-[0.97] active:shadow-[0px_10px_15px_-5px_rgba(236,45,1,0.30)]"
          >
            <span
              className="text-lg font-bold text-rose-50"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              View All Products
            </span>
          </Link>
        </div>
      </div>
    </section>
  );
}
