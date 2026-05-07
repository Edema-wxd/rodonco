import Image from "next/image";
import Link from "next/link";

const footerLinks = [
  {
    heading: "Our Mission",
    links: [
      { label: "Sustainability", href: "/sustainability" },
      { label: "Sourcing", href: "/sourcing" },
      { label: "Chef Partners", href: "/chef-partners" },
    ],
  },
  {
    heading: "Company",
    links: [
      { label: "Careers", href: "/careers" },
      { label: "Press", href: "/press" },
      { label: "Wall of Love", href: "/wall-of-love" },
    ],
  },
  {
    heading: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
      { label: "Cookie Policy", href: "/cookie-policy" },
    ],
  },
] as const;

export function Footer() {
  return (
    <footer className="bg-zinc-100 px-8 py-16">
      <div className="mx-auto max-w-7xl">
        <div className="grid grid-cols-2 gap-12 sm:grid-cols-4">
          {/* Brand */}
          <div className="col-span-2 flex flex-col gap-6 sm:col-span-1">
            <Image
              src="/logo.svg"
              alt="rodo&co"
              width={111}
              height={63}
              className="h-8 w-auto"
            />
            <p
              className="text-xl font-black uppercase text-zinc-900"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              rodo&amp;co
            </p>
            <p
              className="text-sm leading-6 text-zinc-500"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              &copy; 2024 rodo&amp;co. The Culinary Pulse of Nigeria.
            </p>
            {/* Social icons placeholder */}
            <div className="flex gap-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="h-5 w-5 rounded bg-zinc-400" />
              ))}
            </div>
          </div>

          {/* Link columns */}
          {footerLinks.map((col) => (
            <div key={col.heading} className="flex flex-col gap-4">
              <p
                className="text-sm font-bold uppercase tracking-wider text-orange-700"
                style={{ fontFamily: "var(--font-inter)" }}
              >
                {col.heading}
              </p>
              {col.links.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className="text-[10px] font-normal uppercase tracking-wide text-zinc-500 transition-colors hover:text-zinc-800"
                  style={{ fontFamily: "var(--font-lexend)" }}
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>
      </div>
    </footer>
  );
}
