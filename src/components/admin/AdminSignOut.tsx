"use client";

import { LogOut } from "lucide-react";

import { signOutAction } from "@/app/admin/_actions";

function clearClientStorage() {
  try {
    localStorage.clear();
    sessionStorage.clear();
    // Expire every JS-accessible cookie (HttpOnly ones are cleared server-side)
    document.cookie.split(";").forEach((c) => {
      const name = c.split("=")[0].trim();
      document.cookie = `${name}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/`;
    });
  } catch {
    // Silently ignore — storage may be unavailable (private browsing, etc.)
  }
}

export function AdminSignOut() {
  async function handleSignOut() {
    clearClientStorage();
    await signOutAction();
    // Hard navigation bypasses the Next.js router cache so the browser
    // always fetches a fresh unauthenticated page instead of serving
    // the cached dashboard.
    window.location.href = "/admin";
  }

  return (
    <button
      type="button"
      onClick={handleSignOut}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-bold text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
      style={{ fontFamily: "var(--font-lexend)" }}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}
