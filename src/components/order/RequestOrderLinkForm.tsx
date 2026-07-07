// src/components/order/RequestOrderLinkForm.tsx
// Email-entry form for the "My Orders" magic-link flow.
"use client";

import { useState, type FormEvent } from "react";
import { Mail, CheckCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function RequestOrderLinkForm() {
  const [email, setEmail] = useState("");
  const [pending, setPending] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    try {
      const res = await fetch("/api/orders/request-link", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      if (!res.ok) {
        setError("Something went wrong. Please try again.");
        return;
      }

      setSent(true);
    } catch {
      setError("Something went wrong. Please try again.");
    } finally {
      setPending(false);
    }
  }

  if (sent) {
    return (
      <div className="mx-auto max-w-md px-4 py-16 text-center">
        <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-50 ring-4 ring-green-100">
          <CheckCircle className="h-8 w-8" style={{ color: "var(--accent)" }} aria-hidden="true" />
        </div>
        <h1 className="font-heading text-2xl">Check your email</h1>
        <p className="mt-3 text-muted-foreground">
          If <span className="font-medium text-foreground">{email}</span> has any orders with us,
          a link to view them is on its way. The link expires in 30 minutes.
        </p>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-md px-4 py-16">
      <div className="mx-auto mb-6 flex h-14 w-14 items-center justify-center rounded-full bg-muted">
        <Mail className="h-7 w-7 text-muted-foreground" aria-hidden="true" />
      </div>
      <h1 className="font-heading text-center text-2xl">My Orders</h1>
      <p className="mt-3 text-center text-muted-foreground">
        Enter the email address you used at checkout and we&apos;ll send you a link to view your
        order history and status.
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="email">Email address</Label>
          <Input
            id="email"
            name="email"
            type="email"
            autoComplete="email"
            required
            disabled={pending}
            value={email}
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>

        <Button type="submit" disabled={pending} className="w-full">
          {pending ? "Sending…" : "Send me my orders"}
        </Button>

        {error ? (
          <p role="alert" className="text-center text-sm text-destructive">
            {error}
          </p>
        ) : null}
      </form>
    </div>
  );
}
