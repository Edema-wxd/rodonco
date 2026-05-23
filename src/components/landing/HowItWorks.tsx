"use client";

import { useRef, useState } from "react";

const steps = [
  {
    number: "01",
    color: "text-red-700",
    title: "Choose Your Ingredients",
    description: "Browse fresh produce or ready-to-cook kits.",
    accent: "bg-red-700",
  },
  {
    number: "02",
    color: "text-green-800",
    title: "Freshly Prepped",
    description:
      "Your ingredients arrive cleaned, sorted, and ready for your selected prep style.",
    accent: "bg-green-800",
  },
  {
    number: "03",
    color: "text-red-400",
    title: "Cook Your Way",
    description: "Spend less time prepping and more time actually cooking.",
    accent: "bg-red-400",
  },
] as const;

export function HowItWorks() {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [activeIndex, setActiveIndex] = useState(0);

  function handleScroll() {
    const el = scrollRef.current;
    if (!el) return;
    const index = Math.round(el.scrollLeft / el.offsetWidth);
    setActiveIndex(index);
  }

  return (
    <section id="how-it-works" className="overflow-hidden bg-stone-100 py-32">
      <div className="mx-auto max-w-7xl px-8">
        {/* Header */}
        <div className="mb-16 flex items-end justify-between">
          <div className="flex flex-col gap-4">
            <h2
              className="text-4xl font-black uppercase text-zinc-800"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              How It{" "}
              <span className="text-green-800">Works</span>
            </h2>
            <p
              className="max-w-sm text-base leading-6 text-stone-600"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Three simple steps to cut away the stress.
            </p>
          </div>
        </div>

        {/* Step cards — swipe on mobile, grid on md+ */}
        <div
          ref={scrollRef}
          onScroll={handleScroll}
          className="
            -mx-8 flex snap-x snap-mandatory overflow-x-auto scroll-smooth px-8
            scrollbar-none
            md:mx-0 md:grid md:grid-cols-3 md:gap-6 md:overflow-visible md:px-0
          "
          style={{ scrollbarWidth: "none" }}
        >
          {steps.map((step, i) => (
            <div
              key={step.number}
              className="
                mr-6 w-[85vw] flex-none snap-center
                rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px]
                bg-white p-12 shadow-sm outline outline-1 outline-white/50
                last:mr-0
                md:mr-0 md:w-auto md:flex-auto
              "
            >
              <span
                className={`text-6xl font-black leading-none opacity-20 ${step.color}`}
                style={{ fontFamily: "var(--font-quicksand)" }}
              >
                {step.number}
              </span>
              <h3
                className="mt-12 text-2xl font-bold text-zinc-800"
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
              {/* Progress indicator */}
              <div className="hidden mt-10 md:flex items-center gap-2">
                {steps.map((s, j) => (
                  <div
                    key={j}
                    className={`rounded-full ${j === i ? `h-1 w-12 ${step.accent}` : "h-1 w-4 bg-stone-200"}`}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>

        {/* Mobile dot navigation */}
        <div className="mt-6 flex justify-center gap-2 md:hidden">
          {steps.map((step, i) => (
            <button
              key={i}
              aria-label={`Go to step ${i + 1}`}
              onClick={() => {
                scrollRef.current?.scrollTo({
                  left: scrollRef.current.offsetWidth * i,
                  behavior: "smooth",
                });
              }}
              className={`rounded-full transition-all duration-300 active:scale-90 ${
                i === activeIndex
                  ? `h-1 w-12 ${step.accent}`
                  : "h-1 w-4 bg-stone-300 hover:bg-stone-400"
              }`}
            />
          ))}
        </div>
      </div>
    </section>
  );
}
