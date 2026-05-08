"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function AdminSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: "/admin" })}
      className="flex w-full items-center gap-3 rounded-xl px-4 py-2.5 text-left text-sm font-bold text-stone-400 transition-colors hover:bg-red-50 hover:text-red-600"
        style={{ fontFamily: "var(--font-lexend)" }}
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}

