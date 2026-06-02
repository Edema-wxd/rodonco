"use server";

import { cookies } from "next/headers";

export async function setOrderViewCookie(reference: string): Promise<void> {
  const cookieStore = await cookies();
  cookieStore.set(`order_view_${reference}`, "1", {
    httpOnly: true,
    sameSite: "lax",
    maxAge: 86400,
    path: "/",
  });
}
