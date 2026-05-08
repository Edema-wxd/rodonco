import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, render, screen } from "@testing-library/react";

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

const pathnameMock = vi.fn(() => "/admin/orders");
vi.mock("next/navigation", () => ({
  usePathname: () => pathnameMock(),
}));

vi.mock("next-auth/react", () => ({
  signOut: vi.fn(),
}));

import { AdminSidebar } from "./AdminSidebar";

describe("AdminSidebar [D-01, D-04, D-22]", () => {
  beforeEach(() => {
    pathnameMock.mockReset().mockReturnValue("/admin/orders");
  });

  afterEach(() => {
    cleanup();
  });

  it("D-01: renders nav links with the correct hrefs", () => {
    render(<AdminSidebar adminEmail="admin@rodo.com" />);
    expect(screen.getByText("Dashboard").closest("a")?.getAttribute("href")).toBe("/admin");
    expect(screen.getByText("Orders").closest("a")?.getAttribute("href")).toBe("/admin/orders");
    expect(screen.getByText("Products").closest("a")?.getAttribute("href")).toBe("/admin/products");
    expect(screen.getByText("Analytics").closest("a")?.getAttribute("href")).toBe("/admin/analytics");
    expect(screen.getByText("Settings").closest("a")?.getAttribute("href")).toBe("/admin/settings");
  });

  it("D-04: active link gets aria-current='page'", () => {
    pathnameMock.mockReturnValue("/admin/products");
    render(<AdminSidebar adminEmail="a@b.c" />);
    expect(screen.getByText("Products").closest("a")?.getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Orders").closest("a")?.getAttribute("aria-current")).toBeNull();
  });

  it("renders brand text and admin email", () => {
    render(<AdminSidebar adminEmail="admin@rodo.com" />);
    expect(screen.getAllByText(/rodo/i).length).toBeGreaterThan(0);
    expect(screen.getByText("admin@rodo.com")).toBeTruthy();
  });

  it("D-22: renders Sign out button", () => {
    render(<AdminSidebar adminEmail="a@b.c" />);
    expect(screen.getByText("Sign out")).toBeTruthy();
  });
});

