import { describe, expect, it } from "vitest";
import { render } from "react-email";
import React from "react";

import { CartRecoveryEmail } from "./CartRecoveryEmail";
import { formatNgn } from "@/lib/admin/format";

const props = {
  customerName: "Ada Okafor",
  reference: "RC-1234",
  totalNgn: 18500,
  checkoutUrl: "https://example.com/checkout",
  items: [
    {
      id: "i1",
      product_name: "Jollof kit",
      variant_label: "Large",
      prep_option: "Chopped",
      quantity: 2,
      subtotal_ngn: 17000,
    },
    { id: "i2", product_name: "Tomatoes", variant_label: null, prep_option: null, quantity: 1, subtotal_ngn: 1500 },
  ],
};

describe("CartRecoveryEmail", () => {
  it("greets the customer by first name and lists what was in their order", async () => {
    const html = await render(React.createElement(CartRecoveryEmail, props));
    expect(html).toContain("Hi <!-- -->Ada");
    expect(html).toContain("RC-1234");
    expect(html).toContain("Jollof kit");
    expect(html).toContain("Large · Chopped");
    expect(html).toContain("Tomatoes");
    expect(html).toContain(formatNgn(18500));
    expect(html).toContain('href="https://example.com/checkout"');
  });

  it("shows the delivery fee as its own line so the total adds up", async () => {
    const withDelivery = await render(React.createElement(CartRecoveryEmail, { ...props, totalNgn: 20000 }));
    expect(withDelivery).toContain("Delivery");
    expect(withDelivery).toContain(formatNgn(1500));

    const noDelivery = await render(React.createElement(CartRecoveryEmail, props));
    expect(noDelivery).not.toContain(">Delivery<");
  });

  it("mentions the store WhatsApp number only when one is set", async () => {
    const without = await render(React.createElement(CartRecoveryEmail, props));
    expect(without).not.toContain("WhatsApp");

    const withNumber = await render(
      React.createElement(CartRecoveryEmail, { ...props, whatsappNumber: "08086451542" }),
    );
    expect(withNumber).toContain("WhatsApp at 08086451542");
  });
});
