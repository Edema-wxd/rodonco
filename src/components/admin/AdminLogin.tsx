"use client";

import * as React from "react";
import { signIn } from "next-auth/react";

import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export function AdminLogin({
  sessionExpired = false,
  authError = false,
}: {
  sessionExpired?: boolean;
  authError?: boolean;
}) {
  const [error, setError] = React.useState<string | null>(
    authError ? "Invalid email or password. Please try again." : null,
  );
  const [pending, setPending] = React.useState(false);

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setPending(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const email = String(fd.get("email") ?? "").trim();
    const password = String(fd.get("password") ?? "");

    // redirect: false returns a result object instead of redirecting on both
    // success and failure — this lets us show inline errors without a page reload.
    const result = await signIn("credentials", { email, password, redirect: false });

    if (!result?.ok) {
      setError("Invalid email or password. Please try again.");
      setPending(false);
      return;
    }

    // Hard navigation so the browser makes a fresh request with the new
    // session cookie — avoids the router cache serving a stale unauthenticated
    // page or the middleware bouncing the soft navigation back to ?expired=1.
    window.location.href = "/admin/orders";
  }

  return (
    <main className="flex min-h-screen items-center justify-center bg-stone-100 p-4">
      <form
        onSubmit={handleSubmit}
        aria-labelledby="admin-login-heading"
        className="w-full max-w-sm rounded-tl-[32px] rounded-tr-2xl rounded-bl-2xl rounded-br-[32px] border border-stone-200/60 bg-white p-8 shadow-sm"
      >
        {/* Brand mark */}
        <div className="mb-6">
          <p
            className="text-[10px] font-black uppercase tracking-widest text-stone-400"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            Admin
          </p>
          <p
            className="mt-0.5 text-2xl font-black leading-tight text-zinc-800"
            style={{ fontFamily: "var(--font-quicksand)" }}
          >
            rodo<span className="text-red-600">&</span>co
          </p>
        </div>

        <h1
          id="admin-login-heading"
          className="text-base font-bold text-zinc-800"
          style={{ fontFamily: "var(--font-lexend)" }}
        >
          Sign in to continue
        </h1>

        {sessionExpired && !error ? (
          <p
            role="alert"
            className="mt-3 rounded-xl bg-amber-50 px-3 py-2.5 text-sm text-amber-700"
            style={{ fontFamily: "var(--font-inter)" }}
          >
            Your session expired after 24 hours. Please sign in again.
          </p>
        ) : null}

        <div className="mt-5 space-y-4">
          <div className="space-y-1.5">
            <Label
              htmlFor="email"
              className="text-xs font-black uppercase tracking-wider text-stone-400"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Email address
            </Label>
            <Input
              id="email"
              name="email"
              type="email"
              autoComplete="email"
              required
              disabled={pending}
            />
          </div>

          <div className="space-y-1.5">
            <Label
              htmlFor="password"
              className="text-xs font-black uppercase tracking-wider text-stone-400"
              style={{ fontFamily: "var(--font-lexend)" }}
            >
              Password
            </Label>
            <Input
              id="password"
              name="password"
              type="password"
              autoComplete="current-password"
              required
              disabled={pending}
            />
          </div>

          <button
            type="submit"
            disabled={pending}
            className="w-full rounded-full bg-red-600 py-2.5 text-sm font-bold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
            style={{ fontFamily: "var(--font-lexend)" }}
          >
            {pending ? "Signing in…" : "Sign in"}
          </button>

          {error ? (
            <p
              role="alert"
              className="rounded-xl bg-red-50 px-3 py-2.5 text-sm text-red-700"
              style={{ fontFamily: "var(--font-inter)" }}
            >
              {error}
            </p>
          ) : null}
        </div>
      </form>
    </main>
  );
}
