// src/lib/checkout/schemas.test.ts
// Tests for checkoutPayloadSchema — CHKT-02 requirement

import { describe, it, expect } from "vitest";
import { checkoutPayloadSchema } from "./schemas";

const validPayload = {
  name: "Amina Bello",
  email: "amina@example.com",
  phone: "08012345678",
  delivery_address: "12 Banana Island, Ikoyi, Lagos",
  allergy_notes: undefined,
  terms: true,
};

describe("checkoutPayloadSchema", () => {
  describe("valid payloads", () => {
    it("accepts a fully valid payload", () => {
      const result = checkoutPayloadSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("accepts payload with allergy notes", () => {
      const result = checkoutPayloadSchema.safeParse({
        ...validPayload,
        allergy_notes: "No peanuts please",
      });
      expect(result.success).toBe(true);
    });

    it("accepts 11-digit Nigerian mobile starting with 070, 080, 081, 090, 091", () => {
      const validPhones = ["07012345678", "08012345678", "08112345678", "09012345678", "09112345678"];
      for (const phone of validPhones) {
        const result = checkoutPayloadSchema.safeParse({ ...validPayload, phone });
        expect(result.success, `phone ${phone} should pass`).toBe(true);
      }
    });

    it("accepts a payload with no allergy_notes (omitted)", () => {
      const { allergy_notes, ...withoutAllergy } = validPayload;
      const result = checkoutPayloadSchema.safeParse(withoutAllergy);
      expect(result.success).toBe(true);
    });
  });

  describe("invalid phone numbers (CHKT-02)", () => {
    it("rejects a phone number that is too short", () => {
      const result = checkoutPayloadSchema.safeParse({ ...validPayload, phone: "0801234567" });
      expect(result.success).toBe(false);
    });

    it("rejects a phone number that is too long", () => {
      const result = checkoutPayloadSchema.safeParse({ ...validPayload, phone: "080123456789" });
      expect(result.success).toBe(false);
    });

    it("rejects a phone number that does not start with 07/08/09", () => {
      const result = checkoutPayloadSchema.safeParse({ ...validPayload, phone: "05012345678" });
      expect(result.success).toBe(false);
    });

    it("rejects a phone with non-numeric characters", () => {
      const result = checkoutPayloadSchema.safeParse({ ...validPayload, phone: "0801234567a" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty phone string", () => {
      const result = checkoutPayloadSchema.safeParse({ ...validPayload, phone: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("invalid email (CHKT-02)", () => {
    it("rejects an email without @", () => {
      const result = checkoutPayloadSchema.safeParse({ ...validPayload, email: "notanemail" });
      expect(result.success).toBe(false);
    });

    it("rejects an empty email string", () => {
      const result = checkoutPayloadSchema.safeParse({ ...validPayload, email: "" });
      expect(result.success).toBe(false);
    });
  });

  describe("terms checkbox (CHKT-02)", () => {
    it("rejects when terms is false", () => {
      const result = checkoutPayloadSchema.safeParse({ ...validPayload, terms: false });
      expect(result.success).toBe(false);
    });

    it("rejects when terms is absent", () => {
      const { terms, ...noTerms } = validPayload;
      const result = checkoutPayloadSchema.safeParse(noTerms);
      expect(result.success).toBe(false);
    });
  });

  describe("required fields", () => {
    it("rejects empty name", () => {
      const result = checkoutPayloadSchema.safeParse({ ...validPayload, name: "" });
      expect(result.success).toBe(false);
    });

    it("rejects empty delivery address", () => {
      const result = checkoutPayloadSchema.safeParse({ ...validPayload, delivery_address: "" });
      expect(result.success).toBe(false);
    });
  });
});
