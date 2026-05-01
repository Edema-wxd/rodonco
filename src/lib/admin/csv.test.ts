import { describe, expect, it } from "vitest";

import { serializeOrdersCsv } from "./csv";

describe("serializeOrdersCsv", () => {
  it("writes the exact header row", () => {
    const csv = serializeOrdersCsv([]);
    const [header] = csv.split("\n");
    expect(header).toBe(
      "Reference,Customer Name,Phone,Email,Delivery Address,Week Of,Items,Total NGN",
    );
  });

  it("quotes fields containing commas and escapes embedded quotes", () => {
    const csv = serializeOrdersCsv([
      {
        reference: "ref_1",
        customer_name: 'Ada "Boss"',
        customer_phone: "08000000000",
        customer_email: "ada@example.com",
        delivery_address: '12, Example Street, "Ikeja"\nLagos',
        week_of: "2026-05-03",
        items: [{ product_name: "Tomatoes", quantity: 2 }],
        total_ngn: 2500,
      },
    ]);

    expect(csv).toContain('"12, Example Street, ""Ikeja""\nLagos"');
    expect(csv).toContain('"Ada ""Boss"""');
  });

  it("joins items as `Name xQty` separated by `; `", () => {
    const csv = serializeOrdersCsv([
      {
        reference: "ref_1",
        customer_name: "Ada",
        customer_phone: "08000000000",
        customer_email: "ada@example.com",
        delivery_address: "12 Example Street",
        week_of: "2026-05-03",
        items: [
          { product_name: "Tomatoes", quantity: 2 },
          { product_name: "Rice", quantity: 1 },
        ],
        total_ngn: 2500,
      },
    ]);

    expect(csv).toContain('"Tomatoes x2; Rice x1"');
  });
});

