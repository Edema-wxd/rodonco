/**
 * CheckoutCartSummary tests — cart editing at checkout.
 *
 * Verifies the three Task-1 requirements:
 *  1. Remove items from the cart at checkout.
 *  2. Adjust item quantities (+ / −, with − disabled at qty 1).
 *  3. A link back to the shop to add more items.
 */

import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import type { CartItem } from "@/types";

const { mockUpdateQuantity, mockRemoveItem } = vi.hoisted(() => ({
  mockUpdateQuantity: vi.fn(),
  mockRemoveItem: vi.fn(),
}));

// The summary reads updateQuantity / removeItem from the cart store; items come via props.
vi.mock("@/store/cart", () => ({
  useCartStore: (selector: (s: unknown) => unknown) =>
    selector({ updateQuantity: mockUpdateQuantity, removeItem: mockRemoveItem }),
}));

// next/link → plain anchor so we can assert the href without a router.
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>
      {children}
    </a>
  ),
}));

import { CheckoutCartSummary } from "./CheckoutCartSummary";

const items: CartItem[] = [
  {
    productId: "p1",
    productName: "Organic Tomatoes",
    variantLabel: "1kg",
    prepOption: "Diced",
    quantity: 2,
    unitPriceNgn: 1500,
    subtotalNgn: 3000,
  },
  {
    productId: "p2",
    productName: "Cooking Kit A",
    variantLabel: null,
    prepOption: null,
    quantity: 1,
    unitPriceNgn: 8000,
    subtotalNgn: 8000,
  },
];

function renderSummary(props?: Partial<React.ComponentProps<typeof CheckoutCartSummary>>) {
  return render(<CheckoutCartSummary items={items} deliveryFeeNgn={0} {...props} />);
}

describe("CheckoutCartSummary — cart editing at checkout", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("renders an 'Add more items' link back to the shop", () => {
    renderSummary();
    const link = screen.getByRole("link", { name: /add more items/i });
    expect(link.getAttribute("href")).toBe("/shop");
  });

  it("increases quantity via the + button", () => {
    renderSummary();
    fireEvent.click(screen.getByRole("button", { name: /increase quantity of organic tomatoes/i }));
    expect(mockUpdateQuantity).toHaveBeenCalledWith("p1", "1kg", 3, "Diced");
  });

  it("decreases quantity via the − button", () => {
    renderSummary();
    fireEvent.click(screen.getByRole("button", { name: /decrease quantity of organic tomatoes/i }));
    expect(mockUpdateQuantity).toHaveBeenCalledWith("p1", "1kg", 1, "Diced");
  });

  it("disables the − button when quantity is 1 (removal is via Remove instead)", () => {
    renderSummary();
    const dec = screen.getByRole("button", { name: /decrease quantity of cooking kit a/i });
    expect(dec).toHaveProperty("disabled", true);
  });

  it("removes an item via the Remove button", () => {
    renderSummary();
    fireEvent.click(screen.getByRole("button", { name: /remove organic tomatoes/i }));
    expect(mockRemoveItem).toHaveBeenCalledWith("p1", "1kg", "Diced");
  });

  it("shows subtotal and total (₦11,000 with free delivery)", () => {
    renderSummary();
    expect(screen.getAllByText(/11,000/).length).toBeGreaterThan(0);
  });

  it("hides editing controls when editable={false}", () => {
    renderSummary({ editable: false });
    expect(screen.queryByRole("button", { name: /increase quantity/i })).toBeNull();
    expect(screen.queryByRole("link", { name: /add more items/i })).toBeNull();
  });
});
