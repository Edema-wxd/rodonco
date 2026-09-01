const testimonials = [
  {
    quote:
      '"It was such a seamless experience from start to finish, and the packaging? Chef\'s kiss ✨ In terms of the user experience and interface, I\'d honestly rate it a 9."',
    name: "Tomison",
    role: "",
    avatarBg: "bg-red-400",
    cardBg: "bg-stone-100",
    stars: true,
  },
  {
    quote:
      '"I tried the pepper mix from Rodo & Co. and I was genuinely impressed. Everything tasted incredibly fresh, the blend was just the way I like it, and the aroma when I opened it was amazing. The packaging looked clean, professional, and well put together, and the quantity is VERY worth it 👌🏽 It made cooking feel easy and enjoyable."',
    name: "Esther",
    role: "",
    avatarBg: "bg-green-800",
    cardBg: "bg-green-300/20",
    stars: false,
  },
  {
    quote:
      '"The ordering process was seamless, and the responses were quite fast. All in all, it was very good."',
    name: "Adeite",
    role: "",
    avatarBg: "bg-fuchsia-300",
    cardBg: "bg-stone-100",
    stars: false,
  },
  {
    quote:
      '"Tbh, I didn\'t realise how much time prepping actually took until I used Rodo & Co. Everything arrived fresh, neatly packed, and ready to cook. It honestly made the whole cooking process feel lighter."',
    name: "Zara",
    role: "",
    avatarBg: "bg-red-700",
    cardBg: "bg-white",
    stars: false,
    outlined: true,
  },
  {
    quote:
      '"The ingredients looked fresh, the portions were generous, and everything felt thoughtfully prepared. You can tell a lot of care went into both the packaging and the overall experience."',
    name: "Daniel",
    role: "",
    avatarBg: "bg-red-400",
    cardBg: "bg-stone-100",
    stars: false,
  },
  {
    quote:
      '"I loved how easy everything was. No stress, no extra mess (heavy on that extra mess). The ingredients were fresh and prepared exactly how I wanted them. Normally, I hate to cook o, but this one was different."',
    name: "Mena",
    role: "",
    avatarBg: "bg-fuchsia-300",
    cardBg: "bg-green-300/20",
    stars: false,
  },
  {
    quote:
      '"It\'s very user-friendly, and I really love that you guys added the option for known allergies. That was a really nice addition."',
    name: "Motun",
    role: "",
    avatarBg: "bg-red-700",
    cardBg: "bg-stone-100",
    stars: false,
  },
  {
    quote:
      '"I love it so much. I like that I get to see pictures of the quantity and what it looks like whole and sliced. The whole process was seamless."',
    name: "Adesewa",
    role: "",
    avatarBg: "bg-green-800",
    cardBg: "bg-white",
    stars: false,
    outlined: true,
  },
  {
    quote:
      '"It\'s very seamless and easy to navigate. I love the website font too. It feels oddly personal, like I\'m interacting with people instead of a machine."',
    name: "Boluwaduro",
    role: "",
    avatarBg: "bg-fuchsia-300",
    cardBg: "bg-green-300/20",
    stars: false,
  },
  {
    quote:
      '"The allergy options at checkout were the highlight for me. I also love how easy and straightforward the whole process is."',
    name: "Tolulope",
    role: "",
    avatarBg: "bg-red-400",
    cardBg: "bg-stone-100",
    stars: false,
  },
] as const;

export function Testimonials() {
  return (
    <section className="bg-stone-100 py-32">
      <div className="mx-auto max-w-7xl px-8">
        {/* Header */}
        <div className="mb-20 flex flex-col items-start justify-between gap-8 sm:flex-row sm:items-end">
          <div className="flex flex-col gap-4">
            <p
              className="text-sm font-black uppercase tracking-wider text-red-700"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Wall of Love
            </p>
            <h2
              className="text-4xl sm:text-5xl font-black text-zinc-800"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Join the soft cooking life.
            </h2>
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

        {/* Cards grid */}
        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {testimonials.map((t) => (
            <div
              key={t.name}
              className={`flex flex-col gap-4 rounded-[32px] p-8 ${"outlined" in t && t.outlined ? `${t.cardBg} outline outline-1 outline-stone-200 shadow-sm` : t.cardBg}`}
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
      </div>
    </section>
  );
}
