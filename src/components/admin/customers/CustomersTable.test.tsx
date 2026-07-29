import React from "react";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { fireEvent, render, screen, act } from "@testing-library/react";

const mockReplace = vi.fn();
const mockPush = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace, push: mockPush }),
  useSearchParams: () => new URLSearchParams(),
}));

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import type { AdminCustomer } from "@/lib/admin/customers";
import { CustomersTable } from "./CustomersTable";

function makeCustomer(p: Partial<AdminCustomer> & Pick<AdminCustomer, "email">): AdminCustomer {
  return {
    email: p.email,
    name: p.name ?? "Ada Lovelace",
    phone: p.phone ?? "08000000000",
    order_count: p.order_count ?? 3,
    paid_count: p.paid_count ?? 3,
    total_spent_ngn: p.total_spent_ngn ?? 12000,
    first_order_at: p.first_order_at ?? "2026-05-01T10:00:00.000Z",
    last_order_at: p.last_order_at ?? "2026-06-01T10:00:00.000Z",
  };
}

describe("Admin CustomersTable", () => {
  beforeEach(() => {
    mockReplace.mockClear();
    mockPush.mockClear();
  });

  it("renders an empty state when there are no customers", () => {
    render(<CustomersTable customers={[]} />);
    expect(screen.getByText("No customers found")).toBeTruthy();
    expect(screen.getByText("0 customers")).toBeTruthy();
  });

  it("renders a row per customer with name, email and spend", () => {
    render(
      <CustomersTable
        customers={[makeCustomer({ email: "ada@example.com", name: "Ada Lovelace", total_spent_ngn: 12000 })]}
      />,
    );

    expect(screen.getByText("Ada Lovelace")).toBeTruthy();
    expect(screen.getByText("ada@example.com")).toBeTruthy();
    expect(screen.getByText(/12,000/)).toBeTruthy();
    expect(screen.getByText("1 customer")).toBeTruthy();
  });

  it("shows a '(N paid)' hint only when paid orders differ from total orders", () => {
    render(
      <CustomersTable
        customers={[
          makeCustomer({ email: "a@x.com", order_count: 4, paid_count: 1 }),
          makeCustomer({ email: "b@x.com", order_count: 2, paid_count: 2 }),
        ]}
      />,
    );

    expect(screen.getByText(/\(1 paid\)/)).toBeTruthy();
    expect(screen.queryByText(/\(2 paid\)/)).toBeNull();
  });

  it("links each customer to the URL-encoded detail route", () => {
    render(<CustomersTable customers={[makeCustomer({ email: "a+b@x.com", name: "Grace" })]} />);
    const link = screen.getByText("Grace").closest("a") as HTMLAnchorElement;
    expect(link.getAttribute("href")).toBe("/admin/customers/a%2Bb%40x.com");
  });

  it("navigates to the detail page when a row is clicked", () => {
    render(<CustomersTable customers={[makeCustomer({ email: "ada@example.com" })]} />);
    fireEvent.click(screen.getByText("ada@example.com"));
    expect(mockPush).toHaveBeenCalledWith("/admin/customers/ada%40example.com");
  });

  it("debounces search and navigates with a ?search= param", async () => {
    vi.useFakeTimers();
    render(<CustomersTable customers={[makeCustomer({ email: "ada@example.com" })]} />);

    fireEvent.change(screen.getByPlaceholderText("Name, phone, or email"), {
      target: { value: "ada" },
    });
    expect(mockReplace).not.toHaveBeenCalled();

    await act(async () => {
      vi.advanceTimersByTime(300);
    });

    expect(mockReplace.mock.calls[0]?.[0]).toContain("search=ada");
    vi.useRealTimers();
  });

  it("clearing the search removes the ?search= param", async () => {
    vi.useFakeTimers();
    render(<CustomersTable customers={[makeCustomer({ email: "ada@example.com" })]} />);

    const input = screen.getByPlaceholderText("Name, phone, or email");
    fireEvent.change(input, { target: { value: "ada" } });
    await act(async () => { vi.advanceTimersByTime(300); });
    mockReplace.mockClear();

    fireEvent.change(input, { target: { value: "" } });
    await act(async () => { vi.advanceTimersByTime(300); });

    expect(mockReplace.mock.calls[0]?.[0]).not.toContain("search=");
    vi.useRealTimers();
  });
});
