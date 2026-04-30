import Link from "next/link";

import { HowItWorks } from "@/components/landing/HowItWorks";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default function HomePage() {
  return (
    <div>
      <section className="bg-background">
        <div className="mx-auto max-w-7xl px-4 py-24 text-center">
          <h1 className="text-4xl font-bold tracking-tight">
            Fresh prep, every week.
          </h1>
          <p className="mx-auto mt-4 max-w-2xl text-base text-muted-foreground">
            Browse seasonal produce and weekly cooking kits. Ready for your
            Saturday delivery.
          </p>

          <div className="mt-8 flex items-center justify-center">
            <Link
              href="/shop"
              className={cn(
                buttonVariants({ size: "lg" }),
                "bg-[#16a34a] text-white hover:bg-[#15803d]"
              )}
            >
              Shop Fresh Produce
            </Link>
          </div>
        </div>
      </section>

      <HowItWorks />
    </div>
  );
}
