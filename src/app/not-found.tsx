import Link from "next/link";
import { Navbar } from "@/components/layout/Navbar";
import { Footer } from "@/components/landing/Footer";

export default function NotFound() {
  return (
    <>
      <Navbar />
      <main className="flex min-h-[60vh] flex-col items-center justify-center bg-stone-100 py-32 px-8 text-center">
        {/* Section label */}
        <p
          className="text-xs font-black uppercase tracking-wider text-red-600"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          404 — Page not found
        </p>

        {/* H1 */}
        <h1
          className="mt-4 text-5xl font-black leading-[1.05] text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Nothing here yet.
        </h1>

        {/* Body */}
        <p
          className="mt-6 max-w-md text-base leading-7 text-stone-600"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          This page doesn&apos;t exist. Let&apos;s get you back on track.
        </p>

        {/* CTA */}
        <div className="mt-10">
          <Link
            href="/"
            className="relative inline-flex items-center justify-center rounded-full bg-red-600 px-10 py-5 shadow-[0px_20px_25px_-5px_rgba(236,45,1,0.30)] transition-opacity hover:opacity-90"
          >
            <span
              className="text-lg font-bold text-rose-50"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Back to home
            </span>
          </Link>
        </div>
      </main>
      <Footer />
    </>
  );
}
