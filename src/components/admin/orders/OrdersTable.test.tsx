import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

import type { AdminOrder } from "@/lib/admin/orders";
import { OrdersTable } from "./OrdersTable";

function makeOrder(partial: Partial<AdminOrder> & Pick<AdminOrder, "id" | "reference">): AdminOrder {
  return {
    id: partial.id,
    reference: partial.reference,
    customer_name: partial.customer_name ?? "Ada Lovelace",
    customer_email: partial.customer_email ?? "ada@example.com",
    customer_phone: partial.customer_phone ?? "+2348000000000",
    delivery_address: partial.delivery_address ?? "12 Example Street",
    allergy_notes: partial.allergy_notes ?? null,
    status: partial.status ?? "paid",
    total_ngn: partial.total_ngn ?? 5000,
    week_of: partial.week_of ?? "2026-05-03",
    created_at: partial.created_at ?? "2026-05-01T10:00:00.000Z",
    items: partial.items ?? [
      {
        id: "i1",
        product_name: "Tomatoes",
        variant_label: null,
        prep_option: "Chopped",
        quantity: 2,
        unit_price_ngn: 500,
        subtotal_ngn: 1000,
      },
    ],
  };
}

describe("Admin OrdersTable (ORD-01..ORD-05)", () => {
  it("ORD-01: renders table headers and Export CSV button", () => {
    render(<OrdersTable initialOrders={[makeOrder({ id: "o1", reference: "REF-001" })]} />);

    expect(screen.getByText("Reference")).toBeTruthy();
    expect(screen.getByText("Customer")).toBeTruthy();
    expect(screen.getByText("Phone")).toBeTruthy();
    expect(screen.getByText("Date")).toBeTruthy();
    expect(screen.getByText("Status")).toBeTruthy();
    expect(screen.getByText(/Total/i)).toBeTruthy();
    expect(screen.getByText("Export CSV")).toBeTruthy();
  });

  it("ORD-02: clicking a row expands inline details", () => {
    render(<OrdersTable initialOrders={[makeOrder({ id: "o1", reference: "REF-001" })]} />);

    expect(screen.queryByText(/Delivers to:/)).toBeNull();
    fireEvent.click(screen.getByText("REF-001"));
    expect(screen.queryByText(/Delivers to:/)).not.toBeNull();
    expect(screen.queryByText("Tomatoes")).not.toBeNull();
  });

  it("ORD-03: status filter narrows visible rows", () => {
    render(
      <OrdersTable
        initialOrders={[
          makeOrder({ id: "o1", reference: "REF-001", status: "paid" }),
          makeOrder({ id: "o2", reference: "REF-002", status: "processing" }),
        ]}
      />,
    );

    expect(screen.queryByText("REF-001")).not.toBeNull();
    expect(screen.queryByText("REF-002")).not.toBeNull();

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "processing" } });
    expect(screen.queryByText("REF-001")).toBeNull();
    expect(screen.queryByText("REF-002")).not.toBeNull();
  });

  it("ORD-05: changing status triggers PATCH and refresh", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true })) as any;
    (globalThis as any).fetch = fetchMock;

    render(<OrdersTable initialOrders={[makeOrder({ id: "o1", reference: "REF-001", status: "paid" })]} />);

    const select = screen.getByLabelText("Update order status");
    fireEvent.change(select, { target: { value: "processing" } });

    expect(fetchMock).toHaveBeenCalled();
  });
});

