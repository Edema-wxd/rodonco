"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { AlertTriangle, Loader2, Plus, Trash2, UserCheck, X } from "lucide-react";
import { toast } from "sonner";

import type { AdminUser } from "@/lib/admin/adminUsers";

function formatDate(iso: string): string {
  return new Date(iso).toLocaleDateString("en-NG", {
    year: "numeric",
    month: "short",
    day: "numeric",
  });
}

export function UsersTable({
  initialUsers,
  currentEmail,
}: {
  initialUsers: AdminUser[];
  currentEmail: string | null;
}) {
  const router = useRouter();
  const [users, setUsers] = React.useState<AdminUser[]>(initialUsers);

  // Invite form state
  const [showForm, setShowForm] = React.useState(false);
  const [inviteEmail, setInviteEmail] = React.useState("");
  const [inviting, setInviting] = React.useState(false);
  const [emailError, setEmailError] = React.useState("");

  // Per-row delete confirmation
  const [confirmId, setConfirmId] = React.useState<string | null>(null);
  const [deletingId, setDeletingId] = React.useState<string | null>(null);

  function validateEmail(value: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value);
  }

  async function handleInvite() {
    const email = inviteEmail.trim();
    if (!email) {
      setEmailError("Email is required.");
      return;
    }
    if (!validateEmail(email)) {
      setEmailError("Enter a valid email address.");
      return;
    }
    setEmailError("");
    setInviting(true);

    try {
      const res = await fetch("/api/admin/users", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = (await res.json()) as { id?: string; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Failed to invite admin.");
        return;
      }

      toast.success(`Invite sent to ${email}. They'll receive login credentials by email.`);
      setInviteEmail("");
      setShowForm(false);
      router.refresh();

      // Optimistically add to list
      setUsers((prev) => [
        { id: data.id ?? crypto.randomUUID(), email, created_at: new Date().toISOString() },
        ...prev,
      ]);
    } catch {
      toast.error("Failed to invite admin. Please try again.");
    } finally {
      setInviting(false);
    }
  }

  async function handleDelete(id: string) {
    setDeletingId(id);
    try {
      const res = await fetch(`/api/admin/users/${id}`, { method: "DELETE" });
      const data = (await res.json()) as { ok?: boolean; error?: string };

      if (!res.ok) {
        toast.error(data.error ?? "Failed to remove admin.");
        return;
      }

      toast.success("Admin removed.");
      setConfirmId(null);
      setUsers((prev) => prev.filter((u) => u.id !== id));
      router.refresh();
    } catch {
      toast.error("Failed to remove admin. Please try again.");
    } finally {
      setDeletingId(null);
    }
  }

  return (
    <div className="space-y-6">
      {/* Invite form card */}
      <div className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-6 shadow-sm outline outline-1 outline-stone-200/60">
        <div className="flex items-center justify-between">
          <div>
            <p
              className="text-xs font-black uppercase tracking-wider text-stone-400"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Invite
            </p>
            <h2
              className="mt-0.5 text-lg font-black text-zinc-800"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              Add a new admin
            </h2>
          </div>
          {!showForm && (
            <button
              type="button"
              onClick={() => setShowForm(true)}
              className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-5 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700"
              style={{ fontFamily: "var(--font-quicksand)" }}
            >
              <Plus className="h-4 w-4" />
              Invite Admin
            </button>
          )}
        </div>

        {showForm && (
          <div className="mt-5 border-t border-stone-100 pt-5">
            <p
              className="mb-3 text-sm text-stone-500"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              Enter the email address of the person you want to grant admin access. They'll receive
              a login email with a temporary password.
            </p>
            <div className="flex flex-col gap-2 sm:flex-row sm:items-start">
              <div className="flex-1">
                <input
                  type="email"
                  value={inviteEmail}
                  onChange={(e) => {
                    setInviteEmail(e.target.value);
                    if (emailError) setEmailError("");
                  }}
                  onKeyDown={(e) => {
                    if (e.key === "Enter") void handleInvite();
                  }}
                  placeholder="colleague@example.com"
                  autoFocus
                  className={`h-10 w-full rounded-xl border bg-white px-3 text-sm text-zinc-800 outline-none focus:ring-2 focus:ring-red-100 ${
                    emailError
                      ? "border-red-400 focus:border-red-400"
                      : "border-stone-200 focus:border-red-400"
                  }`}
                  style={{ fontFamily: "var(--font-inter)" }}
                />
                {emailError && (
                  <p className="mt-1 text-xs text-red-500" style={{ fontFamily: "var(--font-inter)" }}>
                    {emailError}
                  </p>
                )}
              </div>
              <div className="flex shrink-0 gap-2">
                <button
                  type="button"
                  onClick={() => void handleInvite()}
                  disabled={inviting}
                  className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-5 py-2 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-50"
                  style={{ fontFamily: "var(--font-quicksand)" }}
                >
                  {inviting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      Sending…
                    </>
                  ) : (
                    <>
                      <UserCheck className="h-4 w-4" />
                      Send Invite
                    </>
                  )}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setShowForm(false);
                    setInviteEmail("");
                    setEmailError("");
                  }}
                  className="inline-flex items-center justify-center rounded-full border border-stone-200 px-3 py-2 text-stone-400 transition-colors hover:border-stone-300 hover:text-zinc-700"
                  aria-label="Cancel"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Users list */}
      <div className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white shadow-sm outline outline-1 outline-stone-200/60 overflow-hidden">
        <div className="px-6 py-5 border-b border-stone-100">
          <p
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            {users.length} Admin{users.length !== 1 ? "s" : ""}
          </p>
          <h2
            className="mt-0.5 text-lg font-black text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Active admin accounts
          </h2>
        </div>

        {users.length === 0 ? (
          <div className="px-6 py-12 text-center">
            <p className="text-sm text-stone-400" style={{ fontFamily: "var(--font-inter)" }}>
              No admin accounts found.
            </p>
          </div>
        ) : (
          <ul className="divide-y divide-stone-100">
            {users.map((user) => {
              const isSelf = user.email === currentEmail;
              const isConfirming = confirmId === user.id;
              const isDeleting = deletingId === user.id;

              return (
                <li key={user.id} className="px-6 py-4">
                  <div className="flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        <p
                          className="truncate text-sm font-bold text-zinc-800"
                          style={{ fontFamily: "var(--font-inter)" }}
                        >
                          {user.email}
                        </p>
                        {isSelf && (
                          <span
                            className="shrink-0 rounded-full bg-stone-100 px-2 py-0.5 text-xs font-bold text-stone-500"
                            style={{ fontFamily: "var(--font-quicksand)" }}
                          >
                            You
                          </span>
                        )}
                      </div>
                      <p
                        className="mt-0.5 text-xs text-stone-400"
                        style={{ fontFamily: "var(--font-inter)" }}
                      >
                        Added {formatDate(user.created_at)}
                      </p>
                    </div>

                    {!isSelf && (
                      <div className="shrink-0">
                        {isConfirming ? (
                          <div className="flex items-center gap-2">
                            <span
                              className="flex items-center gap-1 text-xs font-bold text-red-600"
                              style={{ fontFamily: "var(--font-quicksand)" }}
                            >
                              <AlertTriangle className="h-3.5 w-3.5" />
                              Remove this admin?
                            </span>
                            <button
                              type="button"
                              onClick={() => void handleDelete(user.id)}
                              disabled={isDeleting}
                              className="inline-flex items-center gap-1.5 rounded-full bg-red-600 px-4 py-1.5 text-xs font-bold text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                              style={{ fontFamily: "var(--font-quicksand)" }}
                            >
                              {isDeleting && <Loader2 className="h-3 w-3 animate-spin" />}
                              {isDeleting ? "Removing…" : "Confirm"}
                            </button>
                            <button
                              type="button"
                              onClick={() => setConfirmId(null)}
                              disabled={isDeleting}
                              className="rounded-full border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-500 transition-colors hover:border-stone-300 hover:text-zinc-700 disabled:opacity-50"
                              style={{ fontFamily: "var(--font-quicksand)" }}
                            >
                              Cancel
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            onClick={() => setConfirmId(user.id)}
                            className="inline-flex items-center gap-1.5 rounded-full border border-stone-200 px-3 py-1.5 text-xs font-bold text-stone-500 transition-colors hover:border-red-200 hover:bg-red-50 hover:text-red-600"
                            style={{ fontFamily: "var(--font-quicksand)" }}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                            Remove
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
