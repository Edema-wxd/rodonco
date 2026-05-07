import { render } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";
import { Footer } from "@/components/landing/Footer";

vi.mock("next/image", () => ({
  default: (props: Record<string, unknown>) => {
    // eslint-disable-next-line @next/next/no-img-element
    return <img {...props} alt={String(props.alt ?? "")} />;
  },
}));

describe("Footer", () => {
  it("does not render dead links", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('a[href="/sustainability"]')).toBeNull();
    expect(container.querySelector('a[href="/sourcing"]')).toBeNull();
    expect(container.querySelector('a[href="/chef-partners"]')).toBeNull();
    expect(container.querySelector('a[href="/careers"]')).toBeNull();
    expect(container.querySelector('a[href="/press"]')).toBeNull();
  });

  it("renders live links", () => {
    const { container } = render(<Footer />);
    expect(container.querySelector('a[href="/wall-of-love"]')).not.toBeNull();
    expect(container.querySelector('a[href="/privacy"]')).not.toBeNull();
    expect(container.querySelector('a[href="/terms"]')).not.toBeNull();
    expect(container.querySelector('a[href="/cookie-policy"]')).not.toBeNull();
  });
});
