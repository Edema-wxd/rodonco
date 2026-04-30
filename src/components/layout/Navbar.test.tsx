import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

import { useCartStore } from "@/store/cart";

let mockedHasHydrated = false;

vi.mock("next/link", () => ({
  default: ({
    href,
    children,
    ...props
  }: {
    href: string | { pathname?: string };
    children: React.ReactNode;
  }) => {
    const resolvedHref = typeof href === "string" ? href : (href.pathname ?? "");
    // eslint-disable-next-line jsx-a11y/anchor-has-content
    return (
      <a href={resolvedHref} {...props}>
        {children}
      </a>
    );
  },
}));

vi.mock("@/hooks/useHasHydrated", () => ({
  useHasHydrated: () => mockedHasHydrated,
}));

import { Navbar } from "./Navbar";

function addCartLine(productId: string) {
  useCartStore.getState().addItem({
    productId,
    productName: `Product ${productId}`,
    variantLabel: null,
    prepOption: null,
    quantity: 1,
    unitPriceNgn: 100,
    subtotalNgn: 100,
  });
}

describe("Navbar cart badge hydration guard", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    mockedHasHydrated = false;
    useCartStore.setState({ items: [] });
  });

  afterEach(() => {
    cleanup();
  });

  it("does not render badge pre-hydration even if cart has items", () => {
    addCartLine("p1");
    addCartLine("p2");

    mockedHasHydrated = false;
    render(<Navbar />);

    const cartButton = screen.getByRole("button", { name: /open cart/i });
    expect(cartButton.querySelector("span")).toBeNull();
  });

  it("renders badge with correct count after hydration when itemCount > 0", () => {
    addCartLine("p1");
    addCartLine("p2");
    addCartLine("p3");

    mockedHasHydrated = true;
    render(<Navbar />);

    const cartButton = screen.getByRole("button", { name: /open cart/i });
    const badge = cartButton.querySelector("span");
    expect(badge).not.toBeNull();
    expect(badge?.textContent).toBe("3");
  });
});
