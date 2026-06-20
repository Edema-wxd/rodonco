"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Check, Loader2 } from "lucide-react";

import { useCartStore } from "@/store/cart";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { checkoutPayloadSchema, type CheckoutPayload } from "@/lib/checkout/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { CheckoutCartSummary } from "./CheckoutCartSummary";
import { setOrderViewCookie } from "@/app/(customer)/order/[ref]/_actions";
import type { DeliveryZone } from "@/lib/shop/orderingConfig";

type Step = "info" | "payment";

// ─────────────────────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────────────────────

async function saveDraft(payload: CheckoutPayload & { cart: unknown[] }): Promise<void> {
  const res = await fetch("/api/orders/draft", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "Could not save your details. Please try again.");
  }
}

async function initOrder(payload: CheckoutPayload & { cart: unknown[] }): Promise<{
  reference: string;
  authorization_url: string;
  amount_kobo: number;
}> {
  const res = await fetch("/api/orders/init", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  const data = await res.json();
  if (!res.ok) {
    throw new Error(data?.error ?? "Failed to initialise order. Please try again.");
  }
  return data as { reference: string; authorization_url: string; amount_kobo: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Step indicator
// ─────────────────────────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: Step }) {
  const onPayment = current === "payment";
  return (
    <div className="flex items-center gap-3">
      <div className={`flex items-center gap-2 ${onPayment ? "text-muted-foreground" : "text-foreground"}`}>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
            onPayment
              ? "bg-foreground/10 text-foreground"
              : "bg-foreground text-background"
          }`}
        >
          {onPayment ? <Check className="h-3.5 w-3.5" /> : "1"}
        </span>
        <span className="text-sm font-medium">Your details</span>
      </div>

      <div className="h-px w-10 bg-border" />

      <div className={`flex items-center gap-2 ${onPayment ? "text-foreground" : "text-muted-foreground"}`}>
        <span
          className={`flex h-6 w-6 items-center justify-center rounded-full text-xs font-semibold ${
            onPayment
              ? "bg-foreground text-background"
              : "bg-muted text-muted-foreground"
          }`}
        >
          2
        </span>
        <span className="text-sm font-medium">Payment</span>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

const OTHER_AREA = "__other__";

interface CheckoutExperienceProps {
  deliveryFeeNgn: number;
  deliveryZones: DeliveryZone[];
  whatsappNumber: string | null;
}

export function CheckoutExperience({ deliveryFeeNgn, deliveryZones, whatsappNumber }: CheckoutExperienceProps) {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [step, setStep] = useState<Step>("info");
  const [savedPayload, setSavedPayload] = useState<CheckoutPayload | null>(null);
  const [isSaving, setIsSaving] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);
  const [selectedArea, setSelectedArea] = useState<string>("");

  useEffect(() => {
    if (hasHydrated && items.length === 0 && !isSubmitting) {
      router.push("/shop");
    }
  }, [hasHydrated, items.length, router, isSubmitting]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<CheckoutPayload>({
    resolver: zodResolver(checkoutPayloadSchema),
    defaultValues: {
      name: "",
      email: "",
      phone: "",
      delivery_address: "",
      allergy_notes: "",
    },
  });

  const termsChecked = watch("terms") ?? false;

  // Resolve which fee to show in cart summary
  const hasZones = deliveryZones.length > 0;
  const isOutsideArea = selectedArea === OTHER_AREA;
  const matchedZone = hasZones
    ? deliveryZones.find((z) => z.area === selectedArea)
    : undefined;
  const effectiveDeliveryFeeNgn: number | null = hasZones
    ? matchedZone
      ? matchedZone.fee_ngn
      : null
    : deliveryFeeNgn;

  // ── Step 1: save draft, advance to payment ─────────────────────────────────
  const onInfoSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setIsSaving(true);
    try {
      const payload = {
        ...data,
        ...(matchedZone ? { delivery_area: selectedArea } : {}),
      };
      await saveDraft({ ...payload, cart: items });
      setSavedPayload(payload);
      setStep("payment");
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch (err) {
      setServerError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSaving(false);
    }
  });

  // ── Step 2: create order then redirect to Paystack hosted payment page ───────
  const onPay = async () => {
    if (!savedPayload) return;
    setServerError(null);
    setIsSubmitting(true);

    try {
      const result = await initOrder({ ...savedPayload, cart: items });
      // Set the view cookie before leaving so the confirmation page shows full details.
      clearCart();
      await setOrderViewCookie(result.reference);
      window.location.href = result.authorization_url;
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setServerError(msg);
      setIsSubmitting(false);
    }
  };

  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (items.length === 0) return null;

  return (
    <div className="flex flex-col gap-6">
      <StepIndicator current={step} />

      <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto]">
        {/* ── Left column: form or review ── */}
        {step === "info" ? (
          <form onSubmit={onInfoSubmit} noValidate className="flex flex-col gap-6">
            {/* Name */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="name">Full Name</Label>
              <Input
                id="name"
                type="text"
                placeholder="Adaeze Obi"
                aria-invalid={!!errors.name}
                {...register("name")}
              />
              {errors.name && (
                <p className="text-xs text-destructive">{errors.name.message}</p>
              )}
            </div>

            {/* Phone */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="phone">Phone</Label>
              <Input
                id="phone"
                type="tel"
                placeholder="08012345678"
                aria-invalid={!!errors.phone}
                {...register("phone")}
              />
              {errors.phone ? (
                <p className="text-xs text-destructive">{errors.phone.message}</p>
              ) : (
                <p className="text-xs text-muted-foreground">Enter your 11-digit Nigerian number (e.g. 08012345678)</p>
              )}
            </div>

            {/* Email */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="email">Email address</Label>
              <Input
                id="email"
                type="email"
                placeholder="adaeze@example.com"
                aria-invalid={!!errors.email}
                {...register("email")}
              />
              {errors.email && (
                <p className="text-xs text-destructive">{errors.email.message}</p>
              )}
            </div>

            {/* Delivery area */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delivery_area">Delivery Area</Label>
              <select
                id="delivery_area"
                value={selectedArea}
                onChange={(e) => setSelectedArea(e.target.value)}
                className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
              >
                <option value="">Select your area…</option>
                {deliveryZones.map((z) => (
                  <option key={z.area} value={z.area}>
                    {z.area} — {z.fee_ngn === 0 ? "Free delivery" : `₦${z.fee_ngn.toLocaleString()}`}
                  </option>
                ))}
                <option value={OTHER_AREA}>Other / Outside listed areas</option>
              </select>
              {isOutsideArea && (
                <div className="mt-1 rounded-lg border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-800">
                  <p className="font-medium">We don&apos;t currently have a set delivery rate for your area.</p>
                  <p className="mt-1">
                    Please reach out on{" "}
                    <a
                      href={`https://wa.me/${(whatsappNumber ?? "").replace(/\D/g, "")}?text=${encodeURIComponent("Hi! I'd like to get a delivery quote for my order.")}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-semibold underline underline-offset-2 text-green-700 hover:text-green-900"
                    >
                      WhatsApp
                    </a>{" "}
                    and we&apos;ll give you a delivery quote.
                  </p>
                </div>
              )}
              {!isOutsideArea && selectedArea === "" && (
                <p className="text-xs text-muted-foreground">Select your area to see the delivery fee.</p>
              )}
            </div>

            {/* Delivery address */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="delivery_address">Delivery Address</Label>
              <Textarea
                id="delivery_address"
                rows={3}
                placeholder="15 Banana Island Road, Ikoyi, Lagos"
                aria-invalid={!!errors.delivery_address}
                {...register("delivery_address")}
              />
              {errors.delivery_address && (
                <p className="text-xs text-destructive">{errors.delivery_address.message}</p>
              )}
            </div>

            {/* Allergy / dietary notes */}
            <div className="flex flex-col gap-1.5">
              <Label htmlFor="allergy_notes">
                Allergy / Dietary Notes{" "}
                <span className="text-xs text-muted-foreground">(optional)</span>
              </Label>
              <Textarea
                id="allergy_notes"
                rows={2}
                placeholder="No garlic? Less pepper? Tell us."
                {...register("allergy_notes")}
              />
            </div>

            {/* Terms */}
            <div className="flex items-start gap-2">
              <Checkbox
                id="terms"
                checked={termsChecked}
                onCheckedChange={(checked) => {
                  setValue("terms", checked === true ? true : (undefined as unknown as true), {
                    shouldValidate: true,
                  });
                }}
                aria-invalid={!!errors.terms}
              />
              <div className="flex flex-col gap-0.5">
                <Label htmlFor="terms" className="text-sm cursor-pointer leading-snug">
                  I agree to the terms and conditions
                </Label>
                {errors.terms && (
                  <p className="text-xs text-destructive">{errors.terms.message}</p>
                )}
              </div>
            </div>

            {serverError && (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                {serverError}
              </p>
            )}

            <Button
              type="submit"
              disabled={isSaving || isOutsideArea || selectedArea === ""}
              className="w-full"
              size="lg"
            >
              {isSaving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                "Continue to Payment →"
              )}
            </Button>
          </form>
        ) : (
          /* ── Step 2: review details + pay ── */
          <div className="flex flex-col gap-6">
            <Card>
              <CardHeader className="pb-3 flex flex-row items-center justify-between">
                <h2 className="text-base font-semibold">Delivery details</h2>
                <button
                  type="button"
                  onClick={() => {
                    setStep("info");
                    setServerError(null);
                  }}
                  className="text-sm text-muted-foreground underline-offset-4 underline hover:text-foreground transition-colors"
                >
                  Edit
                </button>
              </CardHeader>
              <CardContent>
                <dl className="grid grid-cols-[auto_1fr] gap-x-6 gap-y-2 text-sm">
                  <dt className="text-muted-foreground">Name</dt>
                  <dd>{savedPayload!.name}</dd>
                  <dt className="text-muted-foreground">Phone</dt>
                  <dd>{savedPayload!.phone}</dd>
                  <dt className="text-muted-foreground">Email</dt>
                  <dd className="break-all">{savedPayload!.email}</dd>
                  {savedPayload!.delivery_area && (
                    <>
                      <dt className="text-muted-foreground">Area</dt>
                      <dd>{savedPayload!.delivery_area}</dd>
                    </>
                  )}
                  <dt className="text-muted-foreground">Address</dt>
                  <dd>{savedPayload!.delivery_address}</dd>
                  {savedPayload!.allergy_notes && (
                    <>
                      <dt className="text-muted-foreground">Notes</dt>
                      <dd>{savedPayload!.allergy_notes}</dd>
                    </>
                  )}
                </dl>
              </CardContent>
            </Card>

            {serverError && (
              <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
                {serverError}
              </p>
            )}

            <Button
              onClick={onPay}
              disabled={isSubmitting}
              className="w-full"
              size="lg"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Processing...
                </>
              ) : (
                "Pay Now →"
              )}
            </Button>
          </div>
        )}

        {/* ── Right column: cart summary (always visible) ── */}
        <div className="w-full lg:w-80 xl:w-96">
          <CheckoutCartSummary items={items} deliveryFeeNgn={effectiveDeliveryFeeNgn} />
        </div>
      </div>
    </div>
  );
}
