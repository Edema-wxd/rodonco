// src/lib/email/resendClient.ts
// Singleton Resend SDK client — server-only.
//
// Configured via RESEND_API_KEY environment variable.
// Never import this file in client components.

import "server-only";
import { Resend } from "resend";

if (!process.env.RESEND_API_KEY) {
  console.warn("[resendClient] RESEND_API_KEY is not set — Resend sends will fail at runtime.");
}

export const resend = new Resend(process.env.RESEND_API_KEY ?? "");
