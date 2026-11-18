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

vi.mock("@/app/admin/_actions", () => ({ logAuthEventAction: vi.fn() }));

import { AdminSidebar } from "./AdminSidebar";

describe("AdminSidebar [D-01, D-04, D-22]", () => {
  beforeEach(() => {
    pathnameMock.mockReset().mockReturnValue("/admin/orders");
  });

  afterEach(() => {
    cleanup();
  });

  it("D-01: renders nav links with the correct hrefs", () => {
    render(<AdminSidebar adminEmail="admin@rodo.com" pendingBadge={null} />);
    expect(screen.getByText("Dashboard").closest("a")?.getAttribute("href")).toBe("/admin");
    expect(screen.getByText("Orders").closest("a")?.getAttribute("href")).toBe("/admin/orders");
    expect(screen.getByText("Products").closest("a")?.getAttribute("href")).toBe("/admin/products");
    expect(screen.getByText("Analytics").closest("a")?.getAttribute("href")).toBe("/admin/analytics");
    expect(screen.getByText("Settings").closest("a")?.getAttribute("href")).toBe("/admin/settings");
  });

  it("D-04: active link gets aria-current='page'", () => {
    pathnameMock.mockReturnValue("/admin/products");
    render(<AdminSidebar adminEmail="a@b.c" pendingBadge={null} />);
    expect(screen.getByText("Products").closest("a")?.getAttribute("aria-current")).toBe("page");
    expect(screen.getByText("Orders").closest("a")?.getAttribute("aria-current")).toBeNull();
  });

  it("renders brand text and admin email", () => {
    render(<AdminSidebar adminEmail="admin@rodo.com" pendingBadge={null} />);
    expect(screen.getAllByText(/rodo/i).length).toBeGreaterThan(0);
    expect(screen.getByText("admin@rodo.com")).toBeTruthy();
  });

  it("D-22: renders Sign out button", () => {
    render(<AdminSidebar adminEmail="a@b.c" pendingBadge={null} />);
    expect(screen.getByText("Sign out")).toBeTruthy();
  });

  it("renders fulfilment nav items: Prep List and Manifest", () => {
    render(<AdminSidebar adminEmail="a@b.c" pendingBadge={null} />);
    expect(screen.getByText("Prep List").closest("a")?.getAttribute("href")).toBe("/admin/prep-list");
    expect(screen.getByText("Manifest").closest("a")?.getAttribute("href")).toBe("/admin/manifest");
  });

  it("folds Pending Orders into Orders and drops Abandoned Carts", () => {
    render(<AdminSidebar adminEmail="a@b.c" pendingBadge={null} />);
    expect(screen.queryByText("Pending Orders")).toBeNull();
    expect(screen.queryByText("Abandoned Carts")).toBeNull();
    expect(document.querySelector('a[href="/admin/pending"]')).toBeNull();
    expect(document.querySelector('a[href="/admin/abandoned-carts"]')).toBeNull();
  });

  it("groups nav items under section headings in workflow order", () => {
    render(<AdminSidebar adminEmail="a@b.c" pendingBadge={null} />);
    const groups = Array.from(document.querySelectorAll("nav [role='group']")).map((group) => ({
      heading: group.getAttribute("aria-labelledby")
        ? document.getElementById(group.getAttribute("aria-labelledby")!)?.textContent
        : null,
      items: Array.from(group.querySelectorAll("a")).map((a) => a.textContent),
    }));
    expect(groups).toEqual([
      { heading: null, items: ["Dashboard"] },
      { heading: "Fulfilment", items: ["Orders", "Prep List", "Manifest"] },
      { heading: "Store", items: ["Products", "Customers", "Waitlist"] },
      { heading: "Reports", items: ["Analytics", "Activity", "Email Logs"] },
      { heading: "System", items: ["Admin Users", "Settings"] },
    ]);
  });

  it("shows the pending badge on the Orders link when slot has content", () => {
    render(<AdminSidebar adminEmail="a@b.c" pendingBadge={5} />);
    expect(screen.getByText("5").closest("a")?.getAttribute("href")).toBe("/admin/orders");
  });

  it("hides pending badge when slot is empty", () => {
    render(<AdminSidebar adminEmail="a@b.c" pendingBadge={null} />);
    expect(screen.queryByText("0")).toBeNull();
  });
});

