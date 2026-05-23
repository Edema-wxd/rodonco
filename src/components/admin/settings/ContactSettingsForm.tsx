"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import type { SiteSettingsRow } from "@/lib/admin/config";

interface Props {
  initialSettings: SiteSettingsRow | null;
}

export function ContactSettingsForm({ initialSettings }: Props) {
  const router = useRouter();
  const [whatsapp, setWhatsapp] = React.useState(initialSettings?.whatsapp_number ?? "");
  const [email, setEmail] = React.useState(initialSettings?.contact_email ?? "");
  const [instagram, setInstagram] = React.useState(initialSettings?.instagram_handle ?? "");
  const [submitting, setSubmitting] = React.useState(false);

  async function handleSave() {
    setSubmitting(true);
    try {
      const res = await fetch("/api/admin/site-settings", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          whatsapp_number: whatsapp.trim() || null,
          contact_email: email.trim() || null,
          instagram_handle: instagram.trim() || null,
        }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        toast.error((data as { error?: string }).error ?? "Failed to save contact settings.");
        return;
      }
      toast.success("Contact settings saved.");
      router.refresh();
    } catch {
      toast.error("Failed to save contact settings.");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] bg-white p-8 shadow-sm outline outline-1 outline-stone-200/60">
      <p
        className="text-xs font-black uppercase tracking-wider text-stone-400"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Contact Information
      </p>
      <h2
        className="mt-1 text-lg font-black text-zinc-800"
        style={{ fontFamily: "var(--font-quicksand)" }}
      >
        Customer-facing contact details
      </h2>

      <div className="mt-6 space-y-4">
        {/* WhatsApp */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="whatsapp-number"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            WhatsApp Number
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-stone-400">
              +
            </span>
            <input
              id="whatsapp-number"
              type="tel"
              value={whatsapp.replace(/^\+/, "")}
              onChange={(e) => setWhatsapp("+" + e.target.value.replace(/^\+/, ""))}
              placeholder="2348086451542"
              maxLength={20}
              className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-6 pr-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              style={{ fontFamily: "var(--font-inter)" }}
            />
          </div>
          <p className="text-xs text-stone-400" style={{ fontFamily: "var(--font-inter)" }}>
            Include country code, e.g. 2348086451542
          </p>
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="contact-email"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Contact Email
          </label>
          <input
            id="contact-email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="hello@rodonco.com"
            className="h-10 w-full rounded-xl border border-stone-200 bg-white px-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
            style={{ fontFamily: "var(--font-inter)" }}
          />
        </div>

        {/* Instagram */}
        <div className="flex flex-col gap-1.5">
          <label
            htmlFor="instagram-handle"
            className="text-xs font-black uppercase tracking-wider text-stone-400"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            Instagram Handle
          </label>
          <div className="relative">
            <span className="pointer-events-none absolute inset-y-0 left-3 flex items-center text-sm text-stone-400">
              @
            </span>
            <input
              id="instagram-handle"
              type="text"
              value={instagram.replace(/^@/, "")}
              onChange={(e) => setInstagram(e.target.value.replace(/^@/, ""))}
              placeholder="rodonco"
              maxLength={50}
              className="h-10 w-full rounded-xl border border-stone-200 bg-white pl-7 pr-3 text-sm text-zinc-800 outline-none focus:border-red-400 focus:ring-2 focus:ring-red-100"
              style={{ fontFamily: "var(--font-inter)" }}
            />
          </div>
        </div>
      </div>

      <div className="mt-6">
        <button
          type="button"
          onClick={() => void handleSave()}
          disabled={submitting}
          className="inline-flex items-center gap-2 rounded-full bg-zinc-800 px-6 py-2.5 text-sm font-bold text-white transition-colors hover:bg-zinc-700 disabled:cursor-not-allowed disabled:opacity-40"
          style={{ fontFamily: "var(--font-quicksand)" }}
        >
          {submitting && <Loader2 className="h-4 w-4 animate-spin" />}
          {submitting ? "Saving…" : "Save Contact Info"}
        </button>
      </div>
    </div>
  );
}
