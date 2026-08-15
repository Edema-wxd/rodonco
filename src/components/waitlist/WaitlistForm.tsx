"use client";

import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { CheckCircle2, Loader2, Sparkles } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const waitlistFormSchema = z.object({
  name: z.string().trim().min(1, "Please enter your name").max(200),
  email: z.string().trim().email("Enter a valid email address").max(320),
  area: z.string().trim().min(1, "Tell us where you live").max(200),
});

type WaitlistFormValues = z.infer<typeof waitlistFormSchema>;

export function WaitlistForm() {
  const [submitted, setSubmitted] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<WaitlistFormValues>({
    resolver: zodResolver(waitlistFormSchema),
    defaultValues: { name: "", email: "", area: "" },
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
      <div className="flex flex-col items-center gap-4 py-6 text-center">
        <div className="flex h-14 w-14 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100">
          <CheckCircle2 className="h-7 w-7" style={{ color: "var(--accent)" }} aria-hidden="true" />
        </div>
        <div>
          <h2 className="text-xl font-bold">You&apos;re on the list! 🎉</h2>
          <p className="mt-2 text-sm text-muted-foreground">
            Thanks for joining. We&apos;ll email you the moment rodo&amp;co goes live in your
            area — you&apos;ll be first through the door.
          </p>
        </div>
        <a
          href="/shop"
          className="mt-1 text-sm font-semibold text-red-600 underline-offset-4 hover:underline"
        >
          Peek at the menu while you wait →
        </a>
      </div>
    );
  }

  return (
    <form onSubmit={onSubmit} noValidate className="flex flex-col gap-4">
      {/* Name */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wl-name">Full name</Label>
        <Input
          id="wl-name"
          type="text"
          placeholder="Adaeze Obi"
          autoComplete="name"
          aria-invalid={!!errors.name}
          {...register("name")}
        />
        {errors.name && <p className="text-xs text-destructive">{errors.name.message}</p>}
      </div>

      {/* Email */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wl-email">Email address</Label>
        <Input
          id="wl-email"
          type="email"
          placeholder="adaeze@example.com"
          autoComplete="email"
          aria-invalid={!!errors.email}
          {...register("email")}
        />
        {errors.email && <p className="text-xs text-destructive">{errors.email.message}</p>}
      </div>

      {/* Area */}
      <div className="flex flex-col gap-1.5">
        <Label htmlFor="wl-area">Area you live in</Label>
        <Input
          id="wl-area"
          type="text"
          placeholder="e.g. Lekki Phase 1, Lagos"
          autoComplete="address-level2"
          aria-invalid={!!errors.area}
          {...register("area")}
        />
        {errors.area ? (
          <p className="text-xs text-destructive">{errors.area.message}</p>
        ) : (
          <p className="text-xs text-muted-foreground">
            This helps us decide where to deliver next.
          </p>
        )}
      </div>

      {serverError && (
        <p className="rounded-md border border-destructive/20 bg-destructive/5 px-3 py-2 text-sm text-destructive">
          {serverError}
        </p>
      )}

      <Button type="submit" disabled={isSubmitting} size="lg" className="mt-1 w-full gap-2">
        {isSubmitting ? (
          <>
            <Loader2 className="h-4 w-4 animate-spin" />
            Joining…
          </>
        ) : (
          <>
            <Sparkles className="h-4 w-4" />
            Join the waitlist
          </>
        )}
      </Button>

      <p className="text-center text-xs text-muted-foreground">
        No spam — just one email when we launch near you.
      </p>
    </form>
  );
}
