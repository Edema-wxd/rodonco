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
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            The Local-Global Menu
          </h2>
          <p
            className="mt-4 text-base leading-6 text-stone-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Our chefs bridge the gap between traditional Nigerian soul food and
            modern global convenience.
          </p>
        </div>

        {/* Card grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-3">
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
                    style={{ fontFamily: "var(--font-lexend)" }}
                  >
                    {kit.time}
                  </span>
                  <span
                    className={`rounded-full bg-white/90 px-3 py-1 text-[10px] font-black uppercase tracking-wide backdrop-blur-sm ${kit.difficultyColor}`}
                    style={{ fontFamily: "var(--font-lexend)" }}
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
                  className="w-full rounded-full bg-stone-100 py-4 text-base font-bold text-zinc-800 transition-colors hover:bg-stone-200"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  Add to Box
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Explore link */}
        <div className="mt-16 flex justify-center">
          <Link
            href="/shop"
            className="border-b-2 border-red-700 pb-0.5 text-sm font-black uppercase tracking-wider text-red-700"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            Explore Full 24-Meal Menu
          </Link>
        </div>
      </div>
    </section>
  );
}
