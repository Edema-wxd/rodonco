import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

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

const mockReplace = vi.fn();

vi.mock("next/navigation", () => ({
  useRouter: () => ({ replace: mockReplace }),
  usePathname: () => "/shop",
  useSearchParams: () => new URLSearchParams(""),
}));

import { ProductCard } from "./ProductCard";

function makeProduct(partial: Partial<Product> & Pick<Product, "id" | "name">): Product {
  return {
    id: partial.id,
    name: partial.name,
    description: partial.description ?? null,
    type: partial.type ?? "fresh_produce",
    category: partial.category ?? null,
    image_url: partial.image_url ?? null,
    images: partial.images ?? [],
    is_active: partial.is_active ?? true,
    coming_soon: partial.coming_soon ?? false,
    created_at: partial.created_at ?? new Date(0).toISOString(),
  };
}

describe("ProductCard", () => {
  it("renders price formatting, routes card click to product page, and opens drawer via query param", () => {
    const product = makeProduct({ id: "p1", name: "Tomatoes" });
    const startingPriceNgn = 2_500; // ₦2,500

    render(<ProductCard product={product} startingPriceNgn={startingPriceNgn} />);

    expect(screen.getByText("From ₦2,500")).toBeTruthy();
    const ctaButton = screen.getByRole("button", { name: "Add to Order" });
    expect(ctaButton).toBeTruthy();

    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === `/shop/${product.id}`)).toBe(true);

    fireEvent.click(ctaButton);
    expect(mockReplace).toHaveBeenCalledWith(`/shop?drawer=${product.id}`, { scroll: false });
  });

  it("renders a coming-soon product as an inert, blurred teaser", () => {
    const product = makeProduct({
      id: "p2",
      name: "Egusi Kit",
      coming_soon: true,
      images: [{ url: "https://example.com/egusi.jpg" }],
    });

    const { container } = render(<ProductCard product={product} startingPriceNgn={5_000} />);

    // Teaser label replaces the price and the Add to Order CTA.
    expect(screen.getAllByText("Coming Soon").length).toBeGreaterThan(0);
    expect(screen.queryByText("From ₦5,000")).toBeNull();
    expect(screen.queryByRole("button", { name: "Add to Order" })).toBeNull();

    // Nothing on the card routes anywhere.
    expect(screen.queryAllByRole("link")).toHaveLength(0);

    // The image is blurred.
    const img = container.querySelector('img[src="https://example.com/egusi.jpg"]');
    expect(img?.className).toContain("blur-md");
  });
});

