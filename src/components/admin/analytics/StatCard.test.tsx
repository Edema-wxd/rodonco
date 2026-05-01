import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";

import { StatCard } from "./StatCard";

describe("StatCard", () => {
  it("renders count variant", () => {
    render(<StatCard label="Total Orders" variant="count" value={1234} sublabel="this week" />);

    expect(screen.queryByText("Total Orders")).not.toBeNull();
    expect(screen.queryByText("1,234")).not.toBeNull();
    expect(screen.queryByText("this week")).not.toBeNull();
  });

  it("renders currency variant", () => {
    render(<StatCard label="Total Revenue" variant="currency" value={25000} sublabel="this week" />);

    expect(screen.queryByText("Total Revenue")).not.toBeNull();
    // Intl formatting can vary slightly by runtime; just assert NGN symbol and digits exist.
    expect(screen.queryByText(/₦/)).not.toBeNull();
    expect(screen.queryByText(/25,?000/)).not.toBeNull();
  });

  it("renders list variant", () => {
    render(
      <StatCard
        label="Top Products"
        variant="list"
        items={[
          { name: "Tomatoes", qty: 3 },
          { name: "Pepper", qty: 1 },
        ]}
      />,
    );

    expect(screen.queryByText("Top Products")).not.toBeNull();
    expect(screen.queryByText("Tomatoes")).not.toBeNull();
    expect(screen.queryByText("Pepper")).not.toBeNull();
    expect(screen.queryByText(/× 3/)).not.toBeNull();
    expect(screen.queryByText(/× 1/)).not.toBeNull();
  });

  it("renders list empty state", () => {
    render(<StatCard label="Top Products" variant="list" items={[]} />);
    expect(screen.queryByText("No data yet")).not.toBeNull();
  });

  it("renders breakdown variant", () => {
    render(
      <StatCard
        label="Order Status"
        variant="breakdown"
        items={[
          { label: "paid", count: 5 },
          { label: "processing", count: 2 },
        ]}
      />,
    );

    expect(screen.queryByText("Order Status")).not.toBeNull();
    expect(screen.queryByText("paid")).not.toBeNull();
    expect(screen.queryByText("processing")).not.toBeNull();
    expect(screen.queryByText("5")).not.toBeNull();
    expect(screen.queryByText("2")).not.toBeNull();
  });

  it("renders breakdown empty state", () => {
    render(<StatCard label="Order Status" variant="breakdown" items={[]} />);
    expect(screen.queryByText("No orders yet")).not.toBeNull();
  });
});

