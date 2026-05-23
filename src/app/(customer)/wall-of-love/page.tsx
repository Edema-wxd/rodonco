import Link from "next/link";

const testimonials = [
  {
    quote:
      '"rodo&co literally saved my week. I used to spend 3 hours every Sunday prepping. Now I just pop a kit open after work and I\'m eating restaurant-quality Jollof in 15 mins."',
    name: "Tunde A.",
    role: "Lekki, Lagos",
    avatarBg: "bg-red-400",
    cardBg: "bg-stone-100",
    stars: true,
  },
  {
    quote:
      '"The ingredient freshness is unmatched. Even the scent of the chopped vegetables feels like it just came from the farm. Finally, a service that understands Nigerian flavors!"',
    name: "Chiamaka O.",
    role: "Chef & Nutritionist",
    avatarBg: "bg-green-800",
    cardBg: "bg-green-300/20",
    stars: false,
  },
  {
    quote:
      '"My kids actually help cook now. The visual instructions are so easy to follow. Our new family ritual."',
    name: "Adebayo S.",
    role: "Parent of three",
    avatarBg: "bg-fuchsia-300",
    cardBg: "bg-stone-100",
    stars: false,
  },
  {
    quote:
      '"The Suya-Spiced Chicken Bowl is my go-to post-gym meal. Clean, high protein, and tastes incredible."',
    name: "Banke Y.",
    role: "Fitness Influencer",
    avatarBg: "bg-red-700",
    cardBg: "bg-white",
    stars: false,
    outlined: true,
  },
] as const;

export default function WallOfLovePage() {
  return (
    <div className="bg-stone-100">
      <section className="bg-stone-100 py-16 sm:py-20">
        <div className="mx-auto max-w-7xl px-8">
          <div className="mb-8">
            <Link
              href="/"
              className="text-sm font-black uppercase tracking-wider text-red-700"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              ← Back to home
            </Link>
          </div>

          <div className="mb-16 flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
            <div className="flex flex-col gap-4">
              <p
                className="text-sm font-black uppercase tracking-wider text-red-700"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                Wall of Love
              </p>
              <h1
                className="text-5xl font-black text-zinc-800 sm:text-6xl"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                Join 5,000+ happy chefs.
              </h1>
              <p
                className="max-w-xl text-base leading-6 text-stone-600"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                Real feedback from customers who’ve made weeknight cooking faster, cleaner, and more consistent.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <div className="flex">
                {[0, 1, 2].map((i) => (
                  <div
                    key={i}
                    className="-ml-2 first:ml-0 h-12 w-12 overflow-hidden rounded-full border-4 border-stone-100 bg-stone-300"
                  />
                ))}
              </div>
              <p
                className="pl-2 text-sm font-bold text-zinc-800"
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                4.9/5 Average Rating
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-4">
            {testimonials.map((t) => (
              <div
                key={t.name}
                className={`flex flex-col gap-4 rounded-[32px] p-8 ${
                  "outlined" in t && t.outlined
                    ? `${t.cardBg} outline outline-1 outline-stone-200 shadow-sm`
                    : t.cardBg
                }`}
              >
                {t.stars && (
                  <div className="flex gap-1">
                    {[0, 1, 2, 3, 4].map((i) => (
                      <svg
                        key={i}
                        className="h-5 w-5 text-red-700"
                        viewBox="0 0 20 20"
                        fill="currentColor"
                      >
                        <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
                      </svg>
                    ))}
                  </div>
                )}

                <p
                  className="flex-1 text-base leading-7 text-zinc-800"
                  style={{ fontFamily: "var(--font-inter)" }}
                >
                  {t.quote}
                </p>

                <div className="flex items-center gap-4">
                  <div className={`h-10 w-10 shrink-0 rounded-full ${t.avatarBg}`} />
                  <div>
                    <p
                      className="text-base font-bold text-zinc-800"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {t.name}
                    </p>
                    <p
                      className="text-xs text-stone-600"
                      style={{ fontFamily: "var(--font-inter)" }}
                    >
                      {t.role}
                    </p>
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-16 flex justify-center">
            <Link
              href="/shop"
              className="border-b-2 border-red-700 pb-0.5 text-sm font-black uppercase tracking-wider text-red-700"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Browse the menu
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}

