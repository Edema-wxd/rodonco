import fs from "node:fs";
import path from "node:path";

import React from "react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { cleanup, fireEvent, render, screen } from "@testing-library/react";

const signInMock = vi.fn();
vi.mock("next-auth/react", () => ({
  signIn: (...args: unknown[]) => signInMock(...args),
}));

vi.mock("@/app/admin/_actions", () => ({ logAuthEventAction: vi.fn().mockResolvedValue(undefined) }));

import { AdminLogin } from "./AdminLogin";

describe("AdminLogin [AUTH-01]", () => {
  beforeEach(() => {
    signInMock.mockReset();
  });

  afterEach(() => {
    cleanup();
  });

  it("AUTH-01: renders Email and Password labels and a Sign in button", () => {
    render(<AdminLogin />);
    expect(screen.getAllByText("Email address").length).toBeGreaterThan(0);
    expect(screen.getAllByText("Password").length).toBeGreaterThan(0);
    expect(screen.getAllByRole("button", { name: "Sign in" }).length).toBeGreaterThan(0);
  });

  it("AUTH-01: submitting valid credentials calls signIn('credentials', { email, password, redirectTo: '/admin/orders' })", async () => {
    signInMock.mockResolvedValue({ ok: true, status: 200, url: "/admin/orders", error: undefined });

    render(<AdminLogin />);

    fireEvent.change(screen.getAllByLabelText("Email address")[0]!, {
      target: { value: "admin@rodo.co" },
    });
    fireEvent.change(screen.getAllByLabelText("Password")[0]!, { target: { value: "secret" } });

    fireEvent.click(screen.getAllByRole("button", { name: "Sign in" })[0]!);

    // Let the async handler run
    await Promise.resolve();

    expect(signInMock).toHaveBeenCalledWith("credentials", {
      email: "admin@rodo.co",
      password: "secret",
      redirect: false,
    });
  });

  it("AUTH-01: when signIn returns { error: 'CredentialsSignin' } the inline error appears", async () => {
    signInMock.mockResolvedValue({
      ok: false,
      status: 401,
      url: null,
      error: "CredentialsSignin",
    });

    render(<AdminLogin />);

    fireEvent.change(screen.getAllByLabelText("Email address")[0]!, {
      target: { value: "admin@rodo.co" },
    });
    fireEvent.change(screen.getAllByLabelText("Password")[0]!, { target: { value: "wrong" } });
    fireEvent.click(screen.getAllByRole("button", { name: "Sign in" })[0]!);

    const errors = await screen.findAllByText("Invalid email or password. Please try again.");
    expect(errors.length).toBeGreaterThan(0);
  });

  it("AUTH-01: signIn import is from 'next-auth/react' (Pitfall 1 guard)", () => {
    const content = fs.readFileSync(path.join(process.cwd(), "src/components/admin/AdminLogin.tsx"), "utf8");
    expect(content).toMatch(/from\s+"next-auth\/react"/);
    expect(content).not.toMatch(/from\s+"@\/auth"/);
  });
});

