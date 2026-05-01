import React from "react";
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";

import { OrderingClosedBanner } from "./OrderingClosedBanner";

describe("OrderingClosedBanner", () => {
  it("returns null when ordering is open", () => {
    const { container } = render(<OrderingClosedBanner isOpen={true} nextDeliveryDate="2026-05-02T00:00:00.000Z" />);
    expect(container.firstChild).toBeNull();
  });

  it("renders an alert with the expected prefix and a formatted next delivery date when ordering is closed", () => {
    // Fixed ISO date that formats deterministically across environments.
    const nextDeliveryDate = "2026-05-02T00:00:00.000Z";

    render(<OrderingClosedBanner isOpen={false} nextDeliveryDate={nextDeliveryDate} />);

    const alert = screen.getByRole("alert");
    expect(alert.textContent).toMatch(/^Ordering is closed\.\sNext delivery:/);
    // Format should be "weekday day month" (e.g. "Saturday 2 May") from Intl.DateTimeFormat("en-GB")
    expect(alert.textContent).toContain("Saturday");
    expect(alert.textContent).toContain("2");
    expect(alert.textContent).toContain("May");
  });
});

