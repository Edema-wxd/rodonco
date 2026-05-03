"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { Loader2 } from "lucide-react";
import { toast } from "sonner";

import PaystackPop from "@paystack/inline-js";
import { useCartStore } from "@/store/cart";
import { useHasHydrated } from "@/hooks/useHasHydrated";
import { checkoutPayloadSchema, type CheckoutPayload } from "@/lib/checkout/schemas";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { CheckoutCartSummary } from "./CheckoutCartSummary";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

async function initOrder(payload: CheckoutPayload & { cart: unknown[] }): Promise<{
  reference: string;
  access_code: string;
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

  return data as { reference: string; access_code: string; amount_kobo: number };
}

// ─────────────────────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────────────────────

export function CheckoutExperience() {
  const router = useRouter();
  const hasHydrated = useHasHydrated();
  const items = useCartStore((s) => s.items);
  const clearCart = useCartStore((s) => s.clearCart);

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  // Redirect to /shop if cart is empty after hydration
  useEffect(() => {
    if (hasHydrated && items.length === 0) {
      router.push("/shop");
    }
  }, [hasHydrated, items.length, router]);

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
      // terms starts unchecked — must be explicitly ticked
    },
  });

  const termsChecked = watch("terms") ?? false;

  // ── Submit handler ─────────────────────────────────────────────────────────
  const onSubmit = handleSubmit(async (data) => {
    setServerError(null);
    setIsSubmitting(true);

    try {
      const result = await initOrder({
        ...data,
        cart: items,
      });

      const paystack = new PaystackPop();

      paystack.resumeTransaction(result.access_code, {
        onSuccess: (transaction: unknown) => {
          const txn = transaction as { reference?: string };
          const ref = txn?.reference ?? result.reference;
          // D-08: clear cart before redirect
          clearCart();
          router.push(`/order/${ref}`);
        },
        onCancel: () => {
          // D-04: toast on cancel, stay on page
          toast("Payment cancelled — your cart is still saved.", {
            duration: 5000,
          });
          setIsSubmitting(false);
        },
        onError: (err: unknown) => {
          const msg = (err as { message?: string })?.message ?? "Payment failed. Please try again.";
          setServerError(msg);
          setIsSubmitting(false);
        },
      });
    } catch (err) {
      const msg = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      setServerError(msg);
      setIsSubmitting(false);
    }
  });

  // Don't flash the form before hydration confirms cart has items
  if (!hasHydrated) {
    return (
      <div className="flex items-center justify-center py-20">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  // Empty cart: redirect handled in useEffect above; render nothing during navigation
  if (items.length === 0) {
    return null;
  }

  return (
    <div className="grid grid-cols-1 gap-8 lg:grid-cols-[1fr_auto]">
      {/* ── Left: Checkout Form ── */}
      <form onSubmit={onSubmit} noValidate className="flex flex-col gap-6">
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
            placeholder="+234 XXX XXX XXXX"
            aria-invalid={!!errors.phone}
            {...register("phone")}
          />
          {errors.phone && (
            <p className="text-xs text-destructive">{errors.phone.message}</p>
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

        {/* Allergy / dietary notes (optional) */}
        <div className="flex flex-col gap-1.5">
          <Label htmlFor="allergy_notes">
            Allergy / Dietary Notes{" "}
            <span className="text-xs text-muted-foreground">(optional)</span>
          </Label>
          <Textarea
            id="allergy_notes"
            rows={2}
            placeholder="Any allergies or special prep instructions?"
            {...register("allergy_notes")}
          />
        </div>

        {/* Terms checkbox */}
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

        {/* Server-level error */}
        {serverError && (
          <p className="text-sm text-destructive bg-destructive/5 border border-destructive/20 rounded-md px-3 py-2">
            {serverError}
          </p>
        )}

        {/* Pay Now */}
        <Button
          type="submit"
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
            "Pay Now \u2192"
          )}
        </Button>
      </form>

      {/* ── Right: Cart Summary ── */}
      <div className="w-full lg:w-80 xl:w-96">
        <CheckoutCartSummary items={items} />
      </div>
    </div>
  );
}
