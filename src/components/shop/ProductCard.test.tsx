import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import type { Product } from "@/types";

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

import { ProductCard } from "./ProductCard";

function makeProduct(partial: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    id: partial.id,
    name: partial.name,
    description: partial.description ?? null,
    type: partial.type ?? "fresh_produce",
    image_url: partial.image_url ?? null,
    is_active: partial.is_active ?? true,
    created_at: partial.created_at ?? new Date(0).toISOString(),
  };
}

describe("ProductCard", () => {
  it("renders 'From ₦' formatting, CTA copy, and links to /shop/{product.id}", () => {
    const product = makeProduct({ id: "p1", name: "Tomatoes" });
    const startingPriceNgnKobo = 250_000; // ₦2,500 in kobo

    render(<ProductCard product={product} startingPriceNgn={startingPriceNgnKobo} />);

    expect(screen.getByText("From ₦2,500")).toBeTruthy();
    expect(screen.getByText("Add to Order")).toBeTruthy();

    const ctaLink = screen.getByText("Add to Order").closest("a");
    expect(ctaLink?.getAttribute("href")).toBe(`/shop/${product.id}`);

    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === `/shop/${product.id}`)).toBe(true);
  });
});

