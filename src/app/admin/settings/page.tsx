import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { OrderingToggle } from "@/components/admin/settings/OrderingToggle";
import { ReminderForm } from "@/components/admin/settings/ReminderForm";
import { getOrderingConfig } from "@/lib/admin/config";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const config = await getOrderingConfig();

  return (
    <div className="p-6">
      <h1 className="text-xl font-semibold text-gray-900">Settings</h1>
      <div className="mt-6 max-w-lg space-y-6">
        <OrderingToggle initialIsOpen={config.is_ordering_open} />
        <ReminderForm />
      </div>
    </div>
  );
}

