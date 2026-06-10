import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ContactSettingsForm } from "@/components/admin/settings/ContactSettingsForm";
import { DeliveryConfigForm } from "@/components/admin/settings/DeliveryConfigForm";
import { DeliveryZonesForm } from "@/components/admin/settings/DeliveryZonesForm";
import { OrderingToggle } from "@/components/admin/settings/OrderingToggle";
import { ReminderForm } from "@/components/admin/settings/ReminderForm";
import { getOrderingConfig, getSiteSettings } from "@/lib/admin/config";

export const dynamic = "force-dynamic";

function SectionLabel({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-4">
      <p
        className="text-xs font-black uppercase tracking-widest text-stone-400 shrink-0"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        {children}
      </p>
      <div className="h-px flex-1 bg-stone-200" />
    </div>
  );
}

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const [config, siteSettings] = await Promise.all([
    getOrderingConfig(),
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen bg-stone-100 px-4 py-8 sm:px-8 sm:py-10">
      {/* Page header */}
      <div className="mb-10 max-w-4xl">
        <p
          className="text-xs font-black uppercase tracking-widest text-red-600"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Admin
        </p>
        <h1
          className="mt-1.5 text-4xl font-black leading-[1.05] text-zinc-800 sm:text-5xl"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Settings
        </h1>
      </div>

      <div className="max-w-4xl space-y-10">
        {/* ── Section: Store Operations ── */}
        <section>
          <SectionLabel>Store Operations</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <OrderingToggle initialIsOpen={config.is_ordering_open} />
            <ReminderForm />
          </div>
        </section>

        {/* ── Section: Delivery ── */}
        <section>
          <SectionLabel>Delivery</SectionLabel>
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <DeliveryConfigForm
              initialNextDeliveryDate={config.next_delivery_date}
              initialCutoffMessage={config.cutoff_message}
              initialDeliveryFeeNgn={config.delivery_fee_ngn}
            />
            <DeliveryZonesForm initialZones={config.delivery_zones} />
          </div>
        </section>

        {/* ── Section: Contact ── */}
        <section>
          <SectionLabel>Contact</SectionLabel>
          <div className="sm:max-w-[calc(50%-8px)]">
            <ContactSettingsForm initialSettings={siteSettings} />
          </div>
        </section>
      </div>
    </div>
  );
}
