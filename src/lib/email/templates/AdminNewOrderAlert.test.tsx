// src/lib/email/templates/AdminNewOrderAlert.test.tsx
// Renders the admin new-order alert and asserts the actionable additions:
//  - "Open in dashboard" CTA (present only when a dashboardUrl is passed)
//  - tappable tel: phone link
//  - one-tap wa.me link with a Nigeria-normalised number

import { describe, it, expect } from "vitest";
import { render } from "react-email";
import React from "react";

import { AdminNewOrderAlert } from "./AdminNewOrderAlert";
import type { Order, OrderItem } from "@/types";

const baseOrder: Order = {
  id: "ord_1",
  reference: "RC-TEST-1",
  customer_name: "Ada Obi",
  customer_email: "ada@example.com",
  customer_phone: "08031234567",
  delivery_address: "12 Marina Rd, Lagos Island",
  allergy_notes: null,
  status: "paid",
  total_ngn: 18500,
  week_of: "2026-08-03",
  created_at: "2026-07-28T10:15:00.000Z",
  notified_at: null,
};

const items: OrderItem[] = [
  {
    id: "it_1",
    order_id: "ord_1",
    product_id: "p_1",
    product_name: "Bell Peppers",
    variant_label: null,
    prep_option: "Diced",
    quantity: 3,
    unit_price_ngn: 2500,
    subtotal_ngn: 7500,
  },
];

function renderAlert(order: Order, dashboardUrl?: string): Promise<string> {
  return render(
    React.createElement(AdminNewOrderAlert, { order, items, dashboardUrl })
  );
}

describe("AdminNewOrderAlert", () => {
  it("renders the dashboard CTA linking to the passed deep link", async () => {
    const url = "https://www.rodoandco.com/admin/orders?search=RC-TEST-1";
    const html = await renderAlert(baseOrder, url);

    expect(html).toContain("Open this order in the dashboard");
    expect(html).toContain(url);
  });

  it("omits the CTA when no dashboardUrl is provided", async () => {
    const html = await renderAlert(baseOrder, undefined);

    expect(html).not.toContain("Open this order in the dashboard");
    // Core order detail still renders regardless.
    expect(html).toContain("RC-TEST-1");
    expect(html).toContain("Ada Obi");
  });

  it("makes the customer phone a tappable tel: link", async () => {
    const html = await renderAlert(baseOrder);
    expect(html).toContain("tel:08031234567");
  });

  it("adds a wa.me link, normalising a local 0-prefixed number to 234", async () => {
    const html = await renderAlert(baseOrder);
    expect(html).toContain("https://wa.me/2348031234567");
    expect(html).toContain("Message on WhatsApp");
  });

  it("keeps an already-international +234 number intact for wa.me", async () => {
    const html = await renderAlert({ ...baseOrder, customer_phone: "+234 803 123 4567" });
    expect(html).toContain("https://wa.me/2348031234567");
  });

  it("normalises a 10-digit number with no leading zero to 234", async () => {
    const html = await renderAlert({ ...baseOrder, customer_phone: "8031234567" });
    expect(html).toContain("https://wa.me/2348031234567");
  });
});
