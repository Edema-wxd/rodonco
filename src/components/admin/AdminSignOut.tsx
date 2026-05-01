"use client";

import * as React from "react";
import { signOut } from "next-auth/react";
import { LogOut } from "lucide-react";

export function AdminSignOut() {
  return (
    <button
      type="button"
      onClick={() => signOut({ redirectTo: "/admin" })}
      className="flex w-full items-center gap-2 px-4 py-3 text-left text-sm text-gray-500 transition-colors hover:text-red-600"
    >
      <LogOut className="h-4 w-4" />
      Sign out
    </button>
  );
}

