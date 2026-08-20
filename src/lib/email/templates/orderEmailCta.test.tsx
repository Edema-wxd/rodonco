// src/lib/email/templates/orderEmailCta.test.tsx
// Guards the "track your order" CTA in the two customer-facing emails:
// it renders when a link could be built, and the email still sends without
// it when one could not (missing NEXT_PUBLIC_APP_URL or AUTH_SECRET).

import { describe, it, expect, vi } from "vitest";
import React from "react";
import { render } from "react-email";
vi.mock("server-only", () => ({}));

import { CustomerOrderReceipt } from "@/lib/email/templates/CustomerOrderReceipt";
import { DeliveryReminderEmail } from "@/lib/email/templates/DeliveryReminderEmail";
import { OrderStatusUpdateEmail } from "@/lib/email/templates/OrderStatusUpdateEmail";

const order = {
  id: "1", reference: "RDC-999", customer_name: "Ada", customer_email: "a@b.com",
  customer_phone: "080", delivery_address: "1 St", allergy_notes: null,
  status: "paid" as const, total_ngn: 5000, week_of: "2026-08-22",
  created_at: "2026-08-19T00:00:00Z", notified_at: null,
};
const items = [{ id: "i1", order_id: "1", product_id: "p1", product_name: "Yam",
  variant_label: null, prep_option: null, quantity: 1, unit_price_ngn: 5000, subtotal_ngn: 5000 }];

describe("email CTAs", () => {
  it("receipt includes the track button when trackUrl is set", async () => {
    const html = await render(React.createElement(CustomerOrderReceipt, {
      order, items, nextDeliveryDate: "2026-08-22", contactEmail: "hi@rodoandco.com",
      trackUrl: "https://rodoandco.com/api/orders/verify-link?token=abc&ref=RDC-999",
    } as never));
    expect(html).toContain("Track your order");
    expect(html).toContain("verify-link?token=abc&amp;ref=RDC-999");
  });

  it("receipt omits the button when trackUrl is null", async () => {
    const html = await render(React.createElement(CustomerOrderReceipt, {
      order, items, nextDeliveryDate: "2026-08-22", contactEmail: "hi@rodoandco.com",
      trackUrl: null,
    } as never));
    expect(html).not.toContain("Track your order");
    expect(html).toContain("RDC-999"); // rest of receipt still renders
  });

  it("reminder includes the view button when trackUrl is set", async () => {
    const html = await render(React.createElement(DeliveryReminderEmail, {
      customerName: "Ada", weekOf: "2026-08-22", trackUrl: "https://rodoandco.com/x",
    } as never));
    expect(html).toContain("View your order");
    expect(html).toContain("https://rodoandco.com/x");
  });

  it("reminder omits the button when trackUrl is null", async () => {
    const html = await render(React.createElement(DeliveryReminderEmail, {
      customerName: "Ada", weekOf: "2026-08-22", trackUrl: null,
    } as never));
    expect(html).not.toContain("View your order");
    expect(html).toContain("Ada");
  });
  it("status update includes the track button when trackUrl is set", async () => {
    const html = await render(React.createElement(OrderStatusUpdateEmail, {
      customerName: "Ada", reference: "RDC-999", status: "processing",
      trackUrl: "https://rodoandco.com/api/orders/verify-link?token=abc&ref=RDC-999",
    } as never));
    expect(html).toContain("Track your order");
    expect(html).toContain("verify-link?token=abc&amp;ref=RDC-999");
  });

  it("status update omits the button when trackUrl is null", async () => {
    const html = await render(React.createElement(OrderStatusUpdateEmail, {
      customerName: "Ada", reference: "RDC-999", status: "delivered", trackUrl: null,
    } as never));
    expect(html).not.toContain("Track your order");
    expect(html).toContain("RDC-999"); // rest of the email still renders
    expect(html).toContain("Ada");
  });

  it("status update renders status-specific copy", async () => {
    const cancelled = await render(React.createElement(OrderStatusUpdateEmail, {
      customerName: "Ada", reference: "RDC-999", status: "cancelled", trackUrl: null,
    } as never));
    expect(cancelled).toContain("Your order has been cancelled");

    const processing = await render(React.createElement(OrderStatusUpdateEmail, {
      customerName: "Ada", reference: "RDC-999", status: "processing", trackUrl: null,
    } as never));
    expect(processing).toContain("Your order is being prepared");
  });
});
