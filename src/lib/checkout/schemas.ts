// src/lib/checkout/schemas.ts
// Checkout request Zod validation schema — CHKT-02 requirement.
// Nigerian phone: 11 digits, starts with 07, 08, or 09 (covers all GSM prefixes issued by NCC).

import { z } from "zod";

// Nigerian mobile number regex:
// - 11 digits
// - Starts with 070, 080, 081, 090, 091 (main NG GSM ranges)
// Allows the full 07x, 08x, 09x prefix range while rejecting obviously invalid sequences.
const nigerianPhoneRegex = /^0[7-9][0-9]{9}$/;

export const checkoutPayloadSchema = z
  .object({
    name: z.string().min(1, "Name is required").max(200),
    email: z.string().email("A valid email address is required"),
    phone: z
      .string()
      .regex(nigerianPhoneRegex, "Enter a valid 11-digit Nigerian mobile number (e.g. 08012345678)"),
    delivery_area: z.string().min(1).max(100).optional(),
    delivery_address: z.string().min(1, "Delivery address is required").max(500),
    allergy_notes: z.string().max(500).optional(),
    terms: z.literal(true, {
      errorMap: () => ({ message: "You must accept the terms to proceed" }),
    }),
  })
  .strict();

export type CheckoutPayload = z.infer<typeof checkoutPayloadSchema>;
