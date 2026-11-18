import { describe, expect, it } from "vitest";

import {
  buildRecoveryWhatsAppLink,
  buildRecoveryWhatsAppText,
  describeRecoveryItem,
  describeRecoveryTotal,
  firstName,
  recoveryCheckoutUrl,
  recoveryEmailSubject,
  type RecoveryOrder,
} from "./cartRecovery";
import { formatNgn } from "./format";

const order: RecoveryOrder = {
  reference: "RC-1234",
  customer_name: "Ada Okafor",
  customer_phone: "08031234567",
  total_ngn: 18500,
  items: [
    { product_name: "Jollof kit", variant_label: "Large", prep_option: "Chopped", quantity: 2 },
    { product_name: "Tomatoes", variant_label: null, prep_option: null, quantity: 1 },
  ],
};

describe("cart recovery copy", () => {
  it("greets by first name and falls back when the name is blank", () => {
    expect(firstName("  Ada   Okafor ")).toBe("Ada");
    expect(firstName("")).toBe("there");
  });

  it("describes items with quantity, variant and prep", () => {
    expect(describeRecoveryItem(order.items[0])).toBe("2 × Jollof kit (Large, Chopped)");
    expect(describeRecoveryItem(order.items[1])).toBe("1 × Tomatoes");
  });

  it("links to checkout on the configured site, or the live site when unset", () => {
    expect(recoveryCheckoutUrl("https://example.com/")).toBe("https://example.com/checkout");
    expect(recoveryCheckoutUrl(undefined)).toBe("https://www.rodoandco.com/checkout");
  });

  it("puts the customer's name in the email subject", () => {
    expect(recoveryEmailSubject("Ada Okafor")).toBe("Ada, your Rodo & Co order is still waiting");
  });

  it("builds a WhatsApp message with the name, every item, the total and the checkout link", () => {
    const text = buildRecoveryWhatsAppText(order, "https://example.com/checkout");
    expect(text.startsWith("Hi Ada, this is Rodo & Co.")).toBe(true);
    expect(text).toContain("RC-1234");
    expect(text).toContain("• 2 × Jollof kit (Large, Chopped)");
    expect(text).toContain("• 1 × Tomatoes");
    expect(text).toContain(`Order total: ${formatNgn(18500)}`);
    expect(text).toContain("https://example.com/checkout");
  });

  it("calls out the delivery fee in the total when item prices are known", () => {
    const priced: RecoveryOrder = {
      ...order,
      total_ngn: 20000,
      items: [
        { ...order.items[0], subtotal_ngn: 17000 },
        { ...order.items[1], subtotal_ngn: 1500 },
      ],
    };
    expect(describeRecoveryTotal(priced)).toBe(`${formatNgn(20000)} (including ${formatNgn(1500)} delivery)`);
    expect(describeRecoveryTotal({ ...priced, total_ngn: 18500 })).toBe(formatNgn(18500));
    expect(describeRecoveryTotal(order)).toBe(formatNgn(18500));
  });

  it("opens a chat with the customer's number in international format, message pre-filled", () => {
    const link = buildRecoveryWhatsAppLink(order, "https://example.com/checkout");
    expect(link?.startsWith("https://wa.me/2348031234567?text=")).toBe(true);
    const text = decodeURIComponent(link!.split("?text=")[1]);
    expect(text).toBe(buildRecoveryWhatsAppText(order, "https://example.com/checkout"));
  });

  it("returns no WhatsApp link when the order has no usable phone number", () => {
    expect(buildRecoveryWhatsAppLink({ ...order, customer_phone: "n/a" }, "x")).toBeNull();
  });
});
