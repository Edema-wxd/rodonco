import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { ContactSettingsForm } from "@/components/admin/settings/ContactSettingsForm";
import { DeliveryConfigForm } from "@/components/admin/settings/DeliveryConfigForm";
import { OrderingToggle } from "@/components/admin/settings/OrderingToggle";
import { ReminderForm } from "@/components/admin/settings/ReminderForm";
import { getOrderingConfig, getSiteSettings } from "@/lib/admin/config";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const [config, siteSettings] = await Promise.all([
    getOrderingConfig(),
    getSiteSettings(),
  ]);

  return (
    <div className="min-h-screen bg-stone-100 p-8">
      <div className="mb-8">
        <p
          className="text-sm font-black uppercase tracking-wider text-red-600"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Admin
        </p>
        <h1
          className="mt-2 text-5xl font-black leading-[1.05] text-zinc-800"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Settings
        </h1>
      </div>

      <div className="max-w-lg space-y-6">
        <OrderingToggle initialIsOpen={config.is_ordering_open} />
        <ReminderForm />
        <DeliveryConfigForm
          initialNextDeliveryDate={config.next_delivery_date}
          initialCutoffMessage={config.cutoff_message}
        />
        <ContactSettingsForm initialSettings={siteSettings} />
      </div>
    </div>
  );
}
