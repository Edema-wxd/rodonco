import React from "react";
import { describe, expect, it, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next/link", () => ({
  default: ({ href, children, ...rest }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...rest}>
      {children}
    </a>
  ),
}));

import { CustomersTabs } from "./CustomersTabs";

describe("CustomersTabs", () => {
  it("links to the customers and abandoned carts views", () => {
    render(<CustomersTabs active="customers" abandonedCount={0} />);
    expect(screen.getByText("Customers").closest("a")?.getAttribute("href")).toBe("/admin/customers");
    expect(screen.getByText("Abandoned carts").closest("a")?.getAttribute("href")).toBe(
      "/admin/customers?view=abandoned",
    );
  });

  it("marks the active view with aria-current", () => {
    render(<CustomersTabs active="abandoned" abandonedCount={0} />);
    expect(screen.getByText("Abandoned carts").closest("a")?.getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Customers").closest("a")?.getAttribute("aria-current")).toBeNull();
  });

  it("shows the not-contacted count on the abandoned carts tab only when above zero", () => {
    const { rerender } = render(<CustomersTabs active="customers" abandonedCount={4} />);
    expect(screen.getByText("4").closest("a")?.getAttribute("href")).toBe("/admin/customers?view=abandoned");

    rerender(<CustomersTabs active="customers" abandonedCount={0} />);
    expect(screen.queryByText("0")).toBeNull();
  });
});
