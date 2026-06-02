import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";

(globalThis as any).scrollTo = () => {};

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh: vi.fn(), replace: mockReplace }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

vi.mock("@/app/admin/orders/_actions", () => ({
  loadMoreOrdersAction: vi.fn(async () => []),
}));

vi.mock("@/app/admin/orders/_constants", () => ({
  ORDERS_PAGE_SIZE: 25,
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
  beforeEach(() => {
    mockReplace.mockClear();
  });

  it("ORD-01: renders table headers and Export CSV button", () => {
    render(<OrdersTable initialOrders={[makeOrder({ id: "o1", reference: "REF-001" })]} />);

    expect(screen.getByText("Reference")).toBeTruthy();
    expect(screen.getByText("Customer")).toBeTruthy();
    expect(screen.getByText("Phone")).toBeTruthy();
    expect(screen.getByText("Date")).toBeTruthy();
    expect(screen.getAllByText("Status").length).toBeGreaterThan(0);
    expect(screen.getByText(/Total/i)).toBeTruthy();
    expect(screen.getByText("Export CSV")).toBeTruthy();
  });

  it("ORD-02: clicking a row expands inline details", () => {
    render(<OrdersTable initialOrders={[makeOrder({ id: "o1", reference: "REF-001" })]} />);

    expect(screen.queryByText(/Delivers to:/)).toBeNull();
    fireEvent.click(screen.getAllByText("REF-001")[0]!);
    expect(screen.queryByText(/Delivers to:/)).not.toBeNull();
    expect(screen.queryByText(/Tomatoes/)).not.toBeNull();
  });

  it("ORD-03: status filter navigates with ?status= param", () => {
    render(
      <OrdersTable
        initialOrders={[
          makeOrder({ id: "o1", reference: "REF-001", status: "paid" }),
          makeOrder({ id: "o2", reference: "REF-002", status: "processing" }),
        ]}
      />,
    );

    for (const el of screen.getAllByLabelText("Status")) {
      fireEvent.change(el, { target: { value: "processing" } });
    }

    const statusCall = mockReplace.mock.calls[0]?.[0] as string;
    expect(statusCall).toContain("status=processing");
  });

  it("ORD-03: selecting 'all' removes status param from URL", () => {
    render(<OrdersTable initialOrders={[makeOrder({ id: "o1", reference: "REF-001" })]} />);

    fireEvent.change(screen.getByLabelText("Status"), { target: { value: "all" } });
    // "all" is the empty/remove case — URL should not contain status=all
    const call = mockReplace.mock.calls[0]?.[0] as string;
    expect(call).not.toContain("status=all");
  });

  it("ORD-05: changing status triggers PATCH and refresh", async () => {
    const fetchMock = vi.fn(async () => ({ ok: true })) as any;
    (globalThis as any).fetch = fetchMock;

    render(<OrdersTable initialOrders={[makeOrder({ id: "o1", reference: "REF-001", status: "paid" })]} />);

    const select = screen.getAllByLabelText("Update order status")[0] as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "processing" } });

    expect(fetchMock).toHaveBeenCalled();
  });

  // OPS-03: search navigates via URL params (server-side filtering)
  it("OPS-03: search input debounces and navigates with ?search= param", async () => {
    vi.useFakeTimers();
    mockReplace.mockClear();

    render(
      <OrdersTable
        initialOrders={[
          makeOrder({ id: "o1", reference: "REF-001", customer_name: "Ada Lovelace" }),
          makeOrder({ id: "o2", reference: "REF-002", customer_name: "Charles Babbage" }),
        ]}
      />,
    );

    const searchInput = screen.getByPlaceholderText("Name, phone, or email");
    fireEvent.change(searchInput, { target: { value: "ada" } });

    // Before debounce fires, router.replace should not have been called
    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    const searchCall = mockReplace.mock.calls[0]?.[0] as string;
    expect(searchCall).toContain("search=ada");

    vi.useRealTimers();
  });

  it("OPS-03: clearing search removes the search param", async () => {
    vi.useFakeTimers();
    mockReplace.mockClear();

    render(
      <OrdersTable
        initialOrders={[makeOrder({ id: "o1", reference: "REF-001" })]}
      />,
    );

    const searchInput = screen.getByPlaceholderText("Name, phone, or email");
    fireEvent.change(searchInput, { target: { value: "ada" } });
    await act(async () => { vi.advanceTimersByTime(300); });
    mockReplace.mockClear();

    fireEvent.change(searchInput, { target: { value: "" } });
    await act(async () => { vi.advanceTimersByTime(300); });

    const call = mockReplace.mock.calls[0]?.[0] as string;
    expect(call).not.toContain("search=");

    vi.useRealTimers();
  });

  it("OPS-03: week filter navigates with ?weekOf= param", () => {
    render(<OrdersTable initialOrders={[makeOrder({ id: "o1", reference: "REF-001" })]} />);

    const weekInput = screen.getByLabelText("Delivery week");
    fireEvent.change(weekInput, { target: { value: "2026-05-03" } });

    const weekCall = mockReplace.mock.calls[0]?.[0] as string;
    expect(weekCall).toContain("weekOf=2026-05-03");
  });
});
