/**
 * CheckoutExperience facebook pixel tests
 *
 * Mirrors the mocking strategy of CheckoutExperience.test.tsx (mocked cart
 * store, hydration hook and router) and asserts on window.fbq payloads.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

import type { CartItem } from "@/types";

const { mockPush, mockCartItemsRef, mockHasHydratedRef } = vi.hoisted(() => ({
  mockPush: vi.fn(),
  mockCartItemsRef: { current: [] as CartItem[] },
  mockHasHydratedRef: { current: true },
}));

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("sonner", () => ({ toast: vi.fn() }));

vi.mock("@/store/cart", () => ({
  useCartStore: (
    selector: (state: { items: CartItem[]; clearCart: () => void }) => unknown,
  ) => selector({ items: mockCartItemsRef.current, clearCart: vi.fn() }),
}));

vi.mock("@/hooks/useHasHydrated", () => ({
  useHasHydrated: () => mockHasHydratedRef.current,
}));

import { CheckoutExperience } from "./CheckoutExperience";

const sampleCartItems: CartItem[] = [
  {
    productId: "prod-1",
    productName: "Organic Tomatoes",
    variantLabel: null,
    prepOption: "Diced",
    quantity: 2,
    unitPriceNgn: 1500,
    subtotalNgn: 3000,
  },
  {
    productId: "prod-2",
    productName: "Cooking Kit A",
    variantLabel: "Family (4 people)",
    prepOption: null,
    quantity: 1,
    unitPriceNgn: 8000,
    subtotalNgn: 8000,
  },
];

function renderCheckout() {
  return render(
    <CheckoutExperience
      deliveryFeeNgn={0}
      deliveryZones={[]}
      whatsappNumber={null}
    />,
  );
}

describe("CheckoutExperience — facebook pixel", () => {
  let fbqSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fbqSpy = vi.fn();
    window.fbq = fbqSpy;
    mockCartItemsRef.current = sampleCartItems;
    mockHasHydratedRef.current = true;
    mockPush.mockClear();
  });

  afterEach(() => {
    delete window.fbq;
    vi.unstubAllGlobals();
  });

  const calls = (event: string) =>
    fbqSpy.mock.calls.filter((c: unknown[]) => c[1] === event);

  it("reports InitiateCheckout with cart value and item count", () => {
    renderCheckout();

    expect(calls("InitiateCheckout")).toHaveLength(1);
    expect(calls("InitiateCheckout")[0][2]).toMatchObject({
      value: 11000,
      num_items: 3,
      currency: "NGN",
      contents: [
        { id: "prod-1|Diced", quantity: 2, item_price: 1500 },
        { id: "prod-2|Family (4 people)", quantity: 1, item_price: 8000 },
      ],
    });
  });

  it("reports nothing before the cart has rehydrated — a ₦0 checkout is worse than a late one", () => {
    mockHasHydratedRef.current = false;
    mockCartItemsRef.current = [];
    renderCheckout();

    expect(calls("InitiateCheckout")).toHaveLength(0);
  });

  it("reports AddPaymentInfo once the details step is saved", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({ ok: true, json: async () => ({}) })),
    );
    renderCheckout();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Tunde Bakare" },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: "07011223344" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "tunde@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/delivery address/i), {
      target: { value: "22 Allen Avenue, Ikeja, Lagos" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: /continue to payment/i }),
    );

    await waitFor(() => {
      expect(calls("AddPaymentInfo")).toHaveLength(1);
    });
    expect(calls("AddPaymentInfo")[0][2]).toMatchObject({
      value: 11000,
      currency: "NGN",
    });
  });

  it("reports no AddPaymentInfo when the draft save fails", async () => {
    vi.stubGlobal(
      "fetch",
      vi.fn(async () => ({
        ok: false,
        json: async () => ({ error: "nope" }),
      })),
    );
    renderCheckout();

    fireEvent.change(screen.getByLabelText(/full name/i), {
      target: { value: "Tunde Bakare" },
    });
    fireEvent.change(screen.getByLabelText(/phone/i), {
      target: { value: "07011223344" },
    });
    fireEvent.change(screen.getByLabelText(/email/i), {
      target: { value: "tunde@example.com" },
    });
    fireEvent.change(screen.getByLabelText(/delivery address/i), {
      target: { value: "22 Allen Avenue, Ikeja, Lagos" },
    });
    fireEvent.click(screen.getByRole("checkbox"));
    fireEvent.click(
      screen.getByRole("button", { name: /continue to payment/i }),
    );

    await waitFor(() => {
      expect(screen.getByText("nope")).toBeTruthy();
    });
    expect(calls("AddPaymentInfo")).toHaveLength(0);
  });
});
