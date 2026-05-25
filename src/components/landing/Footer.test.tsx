import React from "react";
import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

vi.mock("server-only", () => ({}));
vi.mock("next/cache", () => ({ unstable_cache: (fn: unknown) => fn }));
vi.mock("@/lib/admin/config", () => ({
  getSiteSettings: vi.fn(() => ({ contact_email: "orders@rodoandco.com" })),
}));
vi.mock("@/lib/email/emailConfig", () => ({
  DEFAULT_CONTACT_EMAIL: "orders@rodoandco.com",
}));

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={String(props.alt ?? "")} />;
  },
}));
vi.mock("next/link", () => ({
  default: ({ href, children, ...props }: { href: string; children: React.ReactNode }) => (
    <a href={href} {...props}>{children}</a>
  ),
}));

import { Footer } from "@/components/landing/Footer";

// Footer is an async Server Component. Resolve it manually before passing to render
// so React's client renderer never sees a pending async element.
async function renderFooter() {
  const jsx = await Footer({});
  return render(jsx as React.ReactElement);
}

describe("Footer", () => {
  it("does not render dead links", async () => {
    const { container } = await renderFooter();
    expect(container.querySelector('a[href="/sustainability"]')).toBeNull();
    expect(container.querySelector('a[href="/sourcing"]')).toBeNull();
    expect(container.querySelector('a[href="/chef-partners"]')).toBeNull();
    expect(container.querySelector('a[href="/careers"]')).toBeNull();
    expect(container.querySelector('a[href="/press"]')).toBeNull();
  });

  it("renders live links", async () => {
    const { container } = await renderFooter();
    expect(container.querySelector('a[href="/wall-of-love"]')).not.toBeNull();
    expect(container.querySelector('a[href="/privacy"]')).not.toBeNull();
    expect(container.querySelector('a[href="/terms"]')).not.toBeNull();
    expect(container.querySelector('a[href="/cookie-policy"]')).not.toBeNull();
  });
});
