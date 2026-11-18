import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, within } from "@testing-library/react";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn() }),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn(), success: vi.fn() },
}));

vi.mock("@/app/admin/customers/_actions", () => ({
  loadMoreAbandonedCartsAction: vi.fn(async () => []),
}));

import type { AbandonedCart } from "@/lib/admin/abandonedCarts";
import { AbandonedCartsTable } from "./AbandonedCartsTable";

function makeCart(p: Partial<AbandonedCart> & Pick<AbandonedCart, "id">): AbandonedCart {
  return {
    id: p.id,
    customer_name: p.customer_name ?? "Ada Lovelace",
    customer_email: p.customer_email ?? "ada@example.com",
    customer_phone: p.customer_phone ?? "08000000000",
    delivery_address: p.delivery_address ?? "12 Example Street",
    allergy_notes: p.allergy_notes ?? null,
    cart_items: p.cart_items ?? [
      {
        productId: "p1",
        productName: "Tomatoes",
        variantLabel: null,
        prepOption: null,
        quantity: 2,
        unitPriceNgn: 500,
        subtotalNgn: 1000,
      },
    ],
    subtotal_ngn: p.subtotal_ngn ?? 1000,
    created_at: p.created_at ?? new Date().toISOString(),
    contacted_at: p.contacted_at ?? null,
  };
}

describe("AbandonedCartsTable", () => {
  beforeEach(() => {
    (globalThis as any).fetch = vi.fn(async () => ({ ok: true }));
  });

  it("lists carts with contact status and cart summary", () => {
    render(
      <AbandonedCartsTable
        initialCarts={[
          makeCart({ id: "c1", customer_name: "Ada Lovelace" }),
          makeCart({
            id: "c2",
            customer_name: "Charles Babbage",
            customer_email: "charles@example.com",
            contacted_at: new Date().toISOString(),
          }),
        ]}
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("Charles Babbage")).toBeTruthy();
    expect(screen.getAllByText(/2 items, ₦1,000/).length).toBe(2);
    expect(within(screen.getByRole("table")).getByText("Contacted")).toBeTruthy();
  });

  it("marking a cart as contacted sends a PATCH and updates the row", async () => {
    render(<AbandonedCartsTable initialCarts={[makeCart({ id: "c1" })]} />);

    await act(async () => {
      fireEvent.click(screen.getByRole("button", { name: "Mark contacted" }));
    });

    const [url, init] = (globalThis.fetch as any).mock.calls[0];
    expect(url).toBe("/api/admin/abandoned-carts/c1");
    expect(init.method).toBe("PATCH");
    expect(init.body).toBe(JSON.stringify({ action: "mark_contacted" }));
    expect(within(screen.getByRole("table")).getByText("Contacted")).toBeTruthy();
  });
});
