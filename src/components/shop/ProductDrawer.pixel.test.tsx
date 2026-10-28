import React from "react";
import { describe, expect, it, vi, beforeEach, afterEach } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

import type { PrepOption, Product, ProductVariant } from "@/types";

vi.mock("next/navigation", () => ({
  useRouter: () => ({ back: vi.fn(), replace: vi.fn() }),
}));

// SideDrawer animates and portals; the pixel wiring doesn't care, so render
// its children directly and hand them a no-op close.
vi.mock("@/components/ui/SideDrawer", () => ({
  SideDrawer: ({
    children,
  }: {
    children: (close: () => void) => React.ReactNode;
  }) => <div>{children(() => {})}</div>,
}));

import { ProductDrawer } from "./ProductDrawer";

function makeProduct(over: Partial<Product> = {}): Product {
  return {
    id: "prod-1",
    name: "Pepper Mix",
    description: null,
    type: "fresh_produce",
    category: null,
    image_url: null,
    images: [],
    is_active: true,
    coming_soon: false,
    created_at: "2026-01-01",
    ...over,
  };
}

const variant: ProductVariant = {
  id: "v1",
  product_id: "prod-1",
  label: "Small",
  price_ngn: 2500,
  is_default: true,
};

const prep: PrepOption = {
  id: "p1",
  product_id: "prod-1",
  label: "Rough blend",
  extra_cost_ngn: 500,
};

describe("ProductDrawer — facebook pixel", () => {
  let fbqSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fbqSpy = vi.fn();
    window.fbq = fbqSpy;
  });

  afterEach(() => {
    delete window.fbq;
  });

  const calls = (event: string) =>
    fbqSpy.mock.calls.filter((c: unknown[]) => c[1] === event);

  it("reports ViewContent once when the drawer opens", () => {
    render(
      <ProductDrawer
        product={makeProduct()}
        variants={[variant]}
        prepOptions={[]}
        isOrderingOpen
      />,
    );

    expect(calls("ViewContent")).toHaveLength(1);
    expect(calls("ViewContent")[0][2]).toMatchObject({
      content_ids: ["prod-1"],
      content_name: "Pepper Mix",
      value: 2500,
      currency: "NGN",
    });
  });

  it("does not re-report ViewContent when a prep option is picked", () => {
    render(
      <ProductDrawer
        product={makeProduct()}
        variants={[variant]}
        prepOptions={[prep]}
        isOrderingOpen
      />,
    );
    fireEvent.click(screen.getByText("Rough blend"));

    expect(calls("ViewContent")).toHaveLength(1);
  });

  it("reports AddToCart with the chosen prep folded into the content id", () => {
    render(
      <ProductDrawer
        product={makeProduct()}
        variants={[variant]}
        prepOptions={[prep]}
        isOrderingOpen
      />,
    );
    fireEvent.click(screen.getByText("Rough blend"));
    fireEvent.click(screen.getByText("Add to cart"));

    expect(calls("AddToCart")).toHaveLength(1);
    expect(calls("AddToCart")[0][2]).toMatchObject({
      contents: [
        { id: "prod-1|Rough blend", quantity: 1, item_price: 3000 },
      ],
      value: 3000,
      currency: "NGN",
    });
  });

  it("reports nothing on AddToCart while a required option is unselected", () => {
    render(
      <ProductDrawer
        product={makeProduct()}
        variants={[variant]}
        prepOptions={[prep]}
        isOrderingOpen
      />,
    );
    fireEvent.click(screen.getByText("Add to cart"));

    expect(calls("AddToCart")).toHaveLength(0);
  });

  it("reports no AddToCart for a coming-soon teaser", () => {
    render(
      <ProductDrawer
        product={makeProduct({ coming_soon: true })}
        variants={[variant]}
        prepOptions={[]}
        isOrderingOpen
      />,
    );
    // "Coming soon" also appears as the header label, so target the button.
    fireEvent.click(screen.getByRole("button", { name: "Coming soon" }));

    expect(calls("AddToCart")).toHaveLength(0);
  });
});
