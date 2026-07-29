import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import type { AdminCustomerDetail } from "@/lib/admin/customers";
import type { AdminOrder } from "@/lib/admin/orders";
import { CustomerDetail } from "./CustomerDetail";

function makeOrder(p: Partial<AdminOrder> & Pick<AdminOrder, "id" | "reference" | "status">): AdminOrder {
  return {
    id: p.id,
    reference: p.reference,
    status: p.status,
    customer_name: p.customer_name ?? "Ada Lovelace",
    customer_email: p.customer_email ?? "ada@example.com",
    customer_phone: p.customer_phone ?? "08000000000",
    delivery_address: p.delivery_address ?? "12 Example Street",
    delivery_area: p.delivery_area ?? null,
    allergy_notes: p.allergy_notes ?? null,
    total_ngn: p.total_ngn ?? 5000,
    week_of: p.week_of ?? "2026-05-03",
    created_at: p.created_at ?? "2026-05-01T10:00:00.000Z",
    items: p.items ?? [
      { id: "i1", product_name: "Tomatoes", variant_label: null, prep_option: "Chopped", quantity: 2, unit_price_ngn: 500, subtotal_ngn: 1000 },
    ],
  };
}

function makeDetail(p?: Partial<AdminCustomerDetail>): AdminCustomerDetail {
  return {
    email: "ada@example.com",
    name: "Ada Lovelace",
    phone: "08000000000",
    order_count: 2,
    paid_count: 1,
    total_spent_ngn: 5000,
    first_order_at: "2026-05-01T10:00:00.000Z",
    last_order_at: "2026-06-01T10:00:00.000Z",
    orders: [
      makeOrder({ id: "o1", reference: "RDC-1", status: "paid", total_ngn: 5000 }),
      makeOrder({ id: "o2", reference: "RDC-2", status: "pending", total_ngn: 500, items: [] }),
    ],
    ...p,
  };
}

describe("Admin CustomerDetail", () => {
  it("renders the customer's name and contact links", () => {
    render(<CustomerDetail customer={makeDetail()} />);

    expect(screen.getByRole("heading", { name: "Ada Lovelace" })).toBeTruthy();
    expect(screen.getByText("ada@example.com").closest("a")?.getAttribute("href")).toBe(
      "mailto:ada@example.com",
    );
    expect(screen.getByText("08000000000").closest("a")?.getAttribute("href")).toBe(
      "tel:08000000000",
    );
  });

  it("renders rollup stats", () => {
    // Distinct spend value so it can't collide with an order total in the list.
    render(<CustomerDetail customer={makeDetail({ order_count: 2, paid_count: 1, total_spent_ngn: 48250 })} />);

    expect(screen.getByText("Orders")).toBeTruthy();
    expect(screen.getByText("Paid orders")).toBeTruthy();
    expect(screen.getByText("Lifetime spend")).toBeTruthy();
    expect(screen.getByText(/48,250/)).toBeTruthy();
  });

  it("lists every order with a link to its confirmation page and its status", () => {
    render(<CustomerDetail customer={makeDetail()} />);

    const ref1 = screen.getByText("RDC-1").closest("a") as HTMLAnchorElement;
    expect(ref1.getAttribute("href")).toBe("/order/RDC-1");
    expect(screen.getByText("RDC-2")).toBeTruthy();

    expect(screen.getByText("paid")).toBeTruthy();
    expect(screen.getByText("pending")).toBeTruthy();
    expect(screen.getByText("Tomatoes")).toBeTruthy();
  });

  it("shows allergy notes when present", () => {
    render(
      <CustomerDetail
        customer={makeDetail({
          orders: [makeOrder({ id: "o1", reference: "RDC-1", status: "paid", allergy_notes: "No nuts" })],
        })}
      />,
    );

    expect(screen.getByText(/No nuts/)).toBeTruthy();
  });
});
