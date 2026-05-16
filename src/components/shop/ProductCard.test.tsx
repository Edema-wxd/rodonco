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
    created_at: partial.created_at ?? new Date(0).toISOString(),
  };
}

describe("ProductCard", () => {
  it("renders price formatting, routes card click to product page, and opens drawer via query param", () => {
    const product = makeProduct({ id: "p1", name: "Tomatoes" });
    const startingPriceNgnKobo = 250_000; // ₦2,500 in kobo

    render(<ProductCard product={product} startingPriceNgn={startingPriceNgnKobo} />);

    expect(screen.getByText("From ₦2,500")).toBeTruthy();
    const ctaButton = screen.getByRole("button", { name: "Add to Order" });
    expect(ctaButton).toBeTruthy();

    const links = screen.getAllByRole("link");
    expect(links.some((l) => l.getAttribute("href") === `/shop/${product.id}`)).toBe(true);

    fireEvent.click(ctaButton);
    expect(mockReplace).toHaveBeenCalledWith(`/shop?drawer=${product.id}`, { scroll: false });
  });
});

