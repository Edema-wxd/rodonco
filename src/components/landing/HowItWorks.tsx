import { Search, Settings2, Truck } from "lucide-react";

const steps = [
  {
    title: "Browse",
    description: "Pick from fresh produce and weekly cooking kits.",
    Icon: Search,
  },
  {
    title: "Customise",
    description: "Choose your prep options and quantities.",
    Icon: Settings2,
  },
  {
    title: "Deliver",
    description: "We deliver fresh every Saturday.",
    Icon: Truck,
  },
] as const;

export function HowItWorks() {
  return (
    <section className="bg-secondary">
      <div className="mx-auto max-w-7xl px-4 py-16">
        <h2 className="text-center text-xl font-bold">How It Works</h2>

        <div className="mt-10 grid gap-8 md:grid-cols-3">
          {steps.map(({ title, description, Icon }) => (
            <div
              key={title}
              className="rounded-xl bg-background p-6 shadow-sm"
            >
              <Icon aria-hidden="true" className="size-6 text-foreground" />
              <h3 className="mt-4 text-xl font-bold">{title}</h3>
              <p className="mt-2 text-base text-muted-foreground">
                {description}
              </p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

