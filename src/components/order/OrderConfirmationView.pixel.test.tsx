/**
 * Purchase reporting on the order confirmation page.
 *
 * This page is reachable repeatedly (refresh, the pending poll's reload, a
 * forwarded link), so these tests pin down the cases where Purchase must NOT
 * fire as much as the one where it must.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render } from "@testing-library/react";

import type { Order, OrderItem } from "@/types";

vi.mock("next/link", () => ({
  default: ({ children }: { children: React.ReactNode }) => <a>{children}</a>,
}));

import { OrderConfirmationView } from "./OrderConfirmationView";

const order: Order = {
  id: "o-1",
  reference: "RODO-123",
  customer_name: "Tunde Bakare",
  customer_email: "tunde@example.com",
  customer_phone: "07011223344",
  delivery_address: "22 Allen Avenue, Ikeja",
  allergy_notes: null,
  status: "paid",
  total_ngn: 13500,
  week_of: "2026-01-03",
  created_at: "2026-01-01",
  notified_at: null,
};

const items: OrderItem[] = [
  {
    id: "oi-1",
    order_id: "o-1",
    product_id: "prod-1",
    product_name: "Organic Tomatoes",
    variant_label: null,
    prep_option: "Diced",
    quantity: 2,
    unit_price_ngn: 1500,
    subtotal_ngn: 3000,
  },
];

function renderView(over: Record<string, unknown> = {}) {
  return render(
    <OrderConfirmationView
      data={{ order, items }}
      nextDeliveryDate="2026-01-03"
      reference={order.reference}
      {...over}
    />,
  );
}

describe("OrderConfirmationView — facebook pixel", () => {
  let fbqSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fbqSpy = vi.fn();
    window.fbq = fbqSpy;
    window.localStorage.clear();
  });

  afterEach(() => {
    delete window.fbq;
  });

  const purchases = () => fbqSpy.mock.calls.filter((c: unknown[]) => c[1] === "Purchase");

  it("reports Purchase with the order total, which includes delivery", () => {
    renderView();

    expect(purchases()).toHaveLength(1);
    expect(purchases()[0][2]).toMatchObject({
      value: 13500,
      currency: "NGN",
      num_items: 2,
      contents: [{ id: "prod-1|Diced", quantity: 2, item_price: 1500 }],
    });
  });

  it("does not report twice when the page is re-rendered or refreshed", () => {
    const { unmount } = renderView();
    unmount();
    renderView();

    expect(purchases()).toHaveLength(1);
  });

  it("does not report on the stripped view — a forwarded link is not this browser's purchase", () => {
    renderView({ stripped: true });

    expect(purchases()).toHaveLength(0);
  });

  it("does not report while payment is still pending", () => {
    renderView({ data: null, errorVariant: "pending" });

    expect(purchases()).toHaveLength(0);
  });

  it("does not report for an unknown reference", () => {
    renderView({ data: null, errorVariant: "not-found" });

    expect(purchases()).toHaveLength(0);
  });
});
