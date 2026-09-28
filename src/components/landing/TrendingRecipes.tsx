import { ChefHat } from "lucide-react";

// Placeholder for the upcoming recipes feature. Static for now — once recipes
// are managed from the admin dashboard this should render real entries.
const PLACEHOLDER_CARDS = 3;

export function TrendingRecipes() {
  return (
    <section className="bg-white py-32">
      <div className="mx-auto max-w-7xl px-8">
        {/* Centered header */}
        <div className="mx-auto mb-16 max-w-2xl text-start sm:text-center">
          <span
            className="inline-block rounded-full bg-stone-100 px-3 py-1 text-[11px] font-bold uppercase tracking-widest text-stone-500"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Coming soon
          </span>
          <h2
            className="mt-4 text-4xl font-black text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Trending <span className="text-green-800">This Week</span>
          </h2>
          <p
            className="mt-4 text-base leading-6 text-stone-600"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Weekly recipes built around what&apos;s in your box. We&apos;re still in the kitchen
            with these.
          </p>
        </div>

        {/* Greyed-out placeholder cards — not clickable */}
        <div
          aria-hidden="true"
          className="flex -mx-4 overflow-x-auto pb-2 md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible"
        >
          {Array.from({ length: PLACEHOLDER_CARDS }, (_, i) => (
            <div
              key={i}
              className="mx-4 min-w-[85vw] max-w-xs shrink-0 select-none overflow-hidden rounded-[32px] bg-stone-50 outline outline-1 outline-stone-200/60 md:mx-0 md:min-w-0 md:max-w-none"
            >
              <div className="flex h-56 items-center justify-center bg-stone-100">
                <ChefHat className="h-10 w-10 text-stone-300" />
              </div>
              <div className="flex flex-col gap-3 p-8">
                <div className="h-5 w-2/3 rounded-full bg-stone-200" />
                <div className="h-3 w-full rounded-full bg-stone-100" />
                <div className="h-3 w-4/5 rounded-full bg-stone-100" />
                <p
                  className="mt-3 w-full rounded-full bg-stone-100 py-4 text-center text-base font-bold text-stone-400"
                  style={{ fontFamily: "var(--font-quicksand)" }}
                >
                  Recipe coming soon
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
