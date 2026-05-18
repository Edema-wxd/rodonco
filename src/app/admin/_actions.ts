"use server";

import { signOut } from "@/auth";

export async function signOutAction() {
  // redirect: false so the server action returns normally — the client
  // handles navigation via window.location.href (hard reload) to bust
  // the Next.js router cache and avoid showing a stale dashboard.
  await signOut({ redirect: false });
}
