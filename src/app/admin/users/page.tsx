import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { getAdminUsers } from "@/lib/admin/adminUsers";
import { UsersTable } from "@/components/admin/users/UsersTable";

export const dynamic = "force-dynamic";

export default async function AdminUsersPage() {
  const session = await auth();
  if (!session?.user) redirect("/admin");

  const users = await getAdminUsers();

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
          Admin Users
        </h1>
        <p
          className="mt-2 text-sm text-stone-500"
          style={{ fontFamily: "var(--font-inter)" }}
        >
          Manage who has access to this admin panel. Newly invited admins receive a temporary
          password by email.
        </p>
      </div>

      <UsersTable initialUsers={users} currentEmail={session.user.email ?? null} />
    </div>
  );
}
