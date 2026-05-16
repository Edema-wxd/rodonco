import Image from "next/image";

export function CleanPromise() {
  return (
    <section className="overflow-hidden bg-green-800 py-32">
      <div className="mx-auto max-w-7xl px-8">
        <div className="grid grid-cols-1 gap-16 lg:grid-cols-2 lg:items-center">
          {/* Image */}
          <div className="flex justify-center lg:justify-start">
            <div className="relative">
              <Image
                src="/images/Our Farm.jpg"
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
              Fresh ingredients. No preservatives. No MSG. No shortcuts. Just properly prepared ingredients ready for your kitchen.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}
