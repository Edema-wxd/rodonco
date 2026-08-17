"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Check, Loader2, ArrowRight } from "lucide-react";

const waitlistFormSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(200),
  email: z.string().trim().email("Enter a valid email address").max(320),
  area: z.string().trim().min(1, "Tell us where you live").max(200),
  cooking_pain: z.string().trim().max(500).optional(),
});

type WaitlistFormValues = z.infer<typeof waitlistFormSchema>;

const fieldClass =
  "h-12 w-full rounded-xl border border-stone-200 bg-[#FBFAF7] px-4 text-[15px] text-zinc-800 placeholder:text-stone-400 outline-none transition-colors focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100 aria-[invalid=true]:border-red-400 aria-[invalid=true]:ring-4 aria-[invalid=true]:ring-red-100";
const textareaClass =
  "min-h-[84px] w-full resize-none rounded-xl border border-stone-200 bg-[#FBFAF7] px-4 py-3 text-[15px] leading-relaxed text-zinc-800 placeholder:text-stone-400 outline-none transition-colors focus:border-red-400 focus:bg-white focus:ring-4 focus:ring-red-100";
const labelClass = "text-[11px] font-bold uppercase tracking-[0.1em] text-stone-500";

export function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues: { name: "", email: "", area: "", cooking_pain: "" },
  });

  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    try {
      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const body = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(body?.error ?? "Something went wrong. Please try again.");
      }
      setSubmitted(true);
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  });

  if (submitted) {
    return (
      <div className="rounded-2xl border border-green-200 bg-white p-7 text-center shadow-[0_20px_40px_-24px_rgba(41,37,36,0.35)]">
        <span className="mx-auto grid h-14 w-14 place-items-center rounded-full bg-green-50 ring-4 ring-green-100">
          <Check className="h-7 w-7 text-green-700" aria-hidden="true" />
        </span>
        <h2 className="mt-4 text-xl font-bold text-zinc-800">You&apos;re on the list</h2>
        <p className="mx-auto mt-2 max-w-xs text-sm leading-relaxed text-stone-500">
          Thanks for joining. We&apos;ll email you the moment rodo&amp;co is delivering to your
          neighbourhood — you&apos;ll be first through the door.
        </p>
      </div>
    );
  }

  return (
    <form
      onSubmit={onSubmit}
      noValidate
      className="rounded-2xl border border-white/60 bg-white/95 p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.55)] backdrop-blur-md sm:p-6"
    >
      <div className="grid gap-4 sm:grid-cols-2">
        {/* Name */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wl-name" className={labelClass}>
            Full name
          </label>
          <input
            id="wl-name"
            type="text"
            placeholder="Adaeze Obi"
            autoComplete="name"
            aria-invalid={!!errors.name}
            className={fieldClass}
            {...register("name")}
          />
          {errors.name && <p className="text-xs font-medium text-red-600">{errors.name.message}</p>}
        </div>

        {/* Email */}
        <div className="flex flex-col gap-1.5">
          <label htmlFor="wl-email" className={labelClass}>
            Email
          </label>
          <input
            id="wl-email"
            type="email"
            placeholder="adaeze@example.com"
            autoComplete="email"
            aria-invalid={!!errors.email}
            className={fieldClass}
            {...register("email")}
          />
          {errors.email && <p className="text-xs font-medium text-red-600">{errors.email.message}</p>}
        </div>
      </div>

      {/* Area */}
      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="wl-area" className={labelClass}>
          Neighbourhood / area
        </label>
        <input
          id="wl-area"
          type="text"
          placeholder="e.g. Lekki Phase 1, Lagos"
          autoComplete="address-level2"
          aria-invalid={!!errors.area}
          className={fieldClass}
          {...register("area")}
        />
        {errors.area ? (
          <p className="text-xs font-medium text-red-600">{errors.area.message}</p>
        ) : (
          <p className="text-xs text-stone-400">This tells us where to deliver next.</p>
        )}
      </div>

      {/* Cooking pain point (open-ended, optional) */}
      <div className="mt-4 flex flex-col gap-1.5">
        <label htmlFor="wl-pain" className="text-sm font-semibold text-stone-600">
          What&apos;s the part of cooking you hate most?{" "}
          <span className="font-normal text-stone-400">(optional)</span>
        </label>
        <textarea
          id="wl-pain"
          rows={2}
          placeholder="Chopping onions? The washing-up? Deciding what to make?"
          className={textareaClass}
          {...register("cooking_pain")}
        />
        <p className="text-xs text-stone-400">
          Tell us what to take off your plate — it shapes what we prep.
        </p>
      </div>

      {serverError && (
        <p className="mt-4 rounded-xl border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700">
          {serverError}
        </p>
      )}

      <button
        type="submit"
        disabled={isSubmitting}
        className="mt-5 inline-flex w-full items-center justify-center gap-2 rounded-full bg-red-600 px-6 py-3.5 text-[15px] font-bold text-rose-50 shadow-[0_18px_25px_-8px_rgba(236,45,1,0.45)] transition-all duration-200 hover:-translate-y-0.5 hover:bg-red-500 hover:shadow-[0_24px_30px_-8px_rgba(236,45,1,0.5)] active:translate-y-0 active:scale-[0.99] disabled:pointer-events-none disabled:opacity-70"
      >
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining…
          </>
        ) : (
          <>
            Save my spot
            <ArrowRight className="h-4 w-4" aria-hidden="true" />
          </>
        )}
      </button>

      <p className="mt-3 text-center text-xs text-stone-400">
        No spam — just one email when we launch near you.
      </p>
    </form>
  );
}
