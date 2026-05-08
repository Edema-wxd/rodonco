import Image from "next/image";
import Link from "next/link";

export function CleanPromise() {
  return (
    <section className="overflow-hidden bg-green-800 py-32">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          {/* Image */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <Image
                src="https://placehold.co/634x560"
                alt="Locally sourced fresh produce"
                width={634}
                height={560}
                className="w-full max-w-[560px] rotate-3 rounded-tl-[48px] rounded-tr-2xl rounded-bl-2xl rounded-br-[48px] shadow-2xl object-cover"
                unoptimized
              />
            </div>
          </div>

          {/* Content */}
          <div className="flex flex-col gap-8">
            <h2
              className="text-6xl font-black leading-[1.1] text-lime-100"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Our{" "}
              <span className="text-green-300">Clean</span>
              <br />
              Ingredient
              <br />
              Promise.
            </h2>

            <p
              className="max-w-lg text-xl leading-8 text-green-300/80"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              We partner with local farmers in Jos and Epe to bring you
              pesticide-free produce harvested within 24 hours of delivery. No
              preservatives, no MSG, no shortcuts.
            </p>

            {/* Stats */}
            <div className="flex gap-16 pt-4">
              <div>
                <p
                  className="text-4xl font-black leading-10 text-lime-100"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  100%
                </p>
                <p
                  className="mt-2 text-sm font-normal uppercase tracking-wider text-lime-100/70"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  Locally Sourced
                </p>
              </div>
              <div>
                <p
                  className="text-4xl font-black leading-10 text-lime-100"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  0
                </p>
                <p
                  className="mt-2 text-sm font-normal uppercase tracking-wider text-lime-100/70"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  Hidden Junk
                </p>
              </div>
            </div>

            <Link
              href="/shop"
              className="inline-flex w-fit items-center justify-center rounded-full bg-white px-10 py-5 transition-opacity hover:opacity-90"
            >
              <span
                className="text-lg font-bold text-green-800"
                style={{ fontFamily: "var(--font-lexend)" }}
              >
                Read Our Sourcing Story
              </span>
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}
