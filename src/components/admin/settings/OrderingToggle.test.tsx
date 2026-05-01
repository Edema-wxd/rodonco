import React from "react";
import { describe, expect, it, vi } from "vitest";
import { fireEvent, render, screen } from "@testing-library/react";

vi.mock("sonner", () => ({
  toast: { error: vi.fn() },
}));

const refresh = vi.fn();
vi.mock("next/navigation", () => ({
  useRouter: () => ({ refresh }),
}));

import { OrderingToggle } from "./OrderingToggle";

describe("OrderingToggle (INFRA-03)", () => {
  it("closing requires inline confirmation and PATCH runs on Yes, Close", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as unknown as Response);

    render(<OrderingToggle initialIsOpen={true} />);

    const toggle = screen.getAllByRole("switch")[0];
    fireEvent.click(toggle);

    expect(screen.getByText("This will prevent new orders. Confirm?")).toBeTruthy();
    fireEvent.click(screen.getByText("Yes, Close"));

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("/api/admin/config");
    expect(init).toBeTruthy();
    expect((init as RequestInit).method).toBe("PATCH");
    expect((init as RequestInit).headers).toEqual({ "Content-Type": "application/json" });
    expect((init as RequestInit).body).toBe(JSON.stringify({ is_ordering_open: false }));

    fetchSpy.mockRestore();
  });

  it("opening does not require confirmation and PATCH runs immediately", async () => {
    const fetchSpy = vi.spyOn(globalThis, "fetch").mockResolvedValue({
      ok: true,
      json: async () => ({}),
    } as unknown as Response);

    render(<OrderingToggle initialIsOpen={false} />);

    const toggle = screen.getAllByRole("switch")[0];
    fireEvent.click(toggle);

    const [, init] = fetchSpy.mock.calls[0] ?? [];
    expect(fetchSpy.mock.calls[0]?.[0]).toBe("/api/admin/config");
    expect(init).toBeTruthy();
    expect((init as RequestInit).method).toBe("PATCH");
    expect((init as RequestInit).headers).toEqual({ "Content-Type": "application/json" });
    expect((init as RequestInit).body).toBe(JSON.stringify({ is_ordering_open: true }));

    fetchSpy.mockRestore();
  });
});

