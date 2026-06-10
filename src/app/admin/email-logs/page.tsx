import { redirect } from "next/navigation";
import { desc } from "drizzle-orm";

import { auth } from "@/auth";
import { db, schema } from "@/lib/db";
import { EmailLogsTable } from "@/components/admin/email-logs/EmailLogsTable";

export const dynamic = "force-dynamic";

export default async function EmailLogsPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const logs = await db
    .select()
    .from(schema.email_logs)
    .orderBy(desc(schema.email_logs.sent_at))
    .limit(500);

  const serialized = logs.map((log) => ({
    ...log,
    sent_at: log.sent_at instanceof Date ? log.sent_at.toISOString() : String(log.sent_at),
  }));

  return (
    <div className="min-h-screen bg-stone-100 p-4 sm:p-8">
      <div className="mb-6 sm:mb-8">
        <p
          className="text-sm font-black uppercase tracking-wider text-red-600"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Admin
        </p>
        <h1
          className="mt-2 text-3xl font-black leading-[1.05] text-zinc-800 sm:text-5xl"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          Email Logs
        </h1>
        <p
          className="mt-2 text-sm text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Monitor all outgoing emails sent via Resend. Shows the last 500 sends.
        </p>
      </div>

      <EmailLogsTable logs={serialized} />
    </div>
  );
}
