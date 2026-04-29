import { beforeEach, describe, expect, it } from "vitest";
import type { CartItem } from "@/types";
import { useCartStore } from "./cart";

function makeItem(input: {
  productId: string;
  productName: string;
  variantLabel: string | null;
  prepOption: string | null;
  quantity: number;
  unitPriceNgn: number;
}): CartItem {
  return {
    ...input,
    subtotalNgn: input.quantity * input.unitPriceNgn,
  };
}

function getLine(items: CartItem[], key: Pick<CartItem, "productId" | "variantLabel" | "prepOption">) {
  const line = items.find(
    (i) =>
      i.productId === key.productId &&
      i.variantLabel === key.variantLabel &&
      i.prepOption === key.prepOption
  );
  if (!line) throw new Error(`Missing cart line for key: ${JSON.stringify(key)}`);
  return line;
}

describe("cart compound-key semantics", () => {
  beforeEach(() => {
    useCartStore.setState({ items: [] });
  });

  it("addItem merges on (productId + variantLabel + prepOption)", () => {
    const unitPriceNgn = 100;
    useCartStore.getState().addItem(
      makeItem({
        productId: "p1",
        productName: "Prod 1",
        variantLabel: "v1",
        prepOption: "prepA",
        quantity: 2,
        unitPriceNgn,
      })
    );

    useCartStore.getState().addItem(
      makeItem({
        productId: "p1",
        productName: "Prod 1",
        variantLabel: "v1",
        prepOption: "prepA",
        quantity: 3,
        unitPriceNgn,
      })
    );

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);

    const line = getLine(items, {
      productId: "p1",
      variantLabel: "v1",
      prepOption: "prepA",
    });
    expect(line.quantity).toBe(5);
    expect(line.subtotalNgn).toBe(5 * unitPriceNgn);
  });

  it("updateQuantity updates only the matching compound-key line item", () => {
    useCartStore.getState().addItem(
      makeItem({
        productId: "p1",
        productName: "Prod 1",
        variantLabel: "v1",
        prepOption: "prepA",
        quantity: 1,
        unitPriceNgn: 100,
      })
    );
    useCartStore.getState().addItem(
      makeItem({
        productId: "p1",
        productName: "Prod 1",
        variantLabel: "v1",
        prepOption: "prepB",
        quantity: 1,
        unitPriceNgn: 200,
      })
    );

    // Intentional: call with the *future* signature (includes prepOption).
    // The current store implementation ignores the extra argument, which should fail.
    (useCartStore.getState() as any).updateQuantity("p1", "v1", 4, "prepA");

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(2);

    const lineA = getLine(items, {
      productId: "p1",
      variantLabel: "v1",
      prepOption: "prepA",
    });
    expect(lineA.quantity).toBe(4);
    expect(lineA.subtotalNgn).toBe(4 * 100);

    const lineB = getLine(items, {
      productId: "p1",
      variantLabel: "v1",
      prepOption: "prepB",
    });
    expect(lineB.quantity).toBe(1);
    expect(lineB.subtotalNgn).toBe(1 * 200);
  });

  it("removeItem removes only the matching compound-key line item", () => {
    useCartStore.getState().addItem(
      makeItem({
        productId: "p1",
        productName: "Prod 1",
        variantLabel: "v1",
        prepOption: "prepA",
        quantity: 1,
        unitPriceNgn: 100,
      })
    );
    useCartStore.getState().addItem(
      makeItem({
        productId: "p1",
        productName: "Prod 1",
        variantLabel: "v1",
        prepOption: "prepB",
        quantity: 1,
        unitPriceNgn: 200,
      })
    );

    // Intentional: call with the *future* signature (includes prepOption).
    (useCartStore.getState() as any).removeItem("p1", "v1", "prepA");

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].prepOption).toBe("prepB");
  });

  it("qty <= 0 removal respects the compound-key prepOption", () => {
    useCartStore.getState().addItem(
      makeItem({
        productId: "p1",
        productName: "Prod 1",
        variantLabel: "v1",
        prepOption: "prepA",
        quantity: 2,
        unitPriceNgn: 100,
      })
    );
    useCartStore.getState().addItem(
      makeItem({
        productId: "p1",
        productName: "Prod 1",
        variantLabel: "v1",
        prepOption: "prepB",
        quantity: 1,
        unitPriceNgn: 200,
      })
    );

    // Intentional: call with the *future* signature (includes prepOption).
    (useCartStore.getState() as any).updateQuantity("p1", "v1", 0, "prepA");

    const items = useCartStore.getState().items;
    expect(items).toHaveLength(1);
    expect(items[0].prepOption).toBe("prepB");
    expect(items[0].quantity).toBe(1);
  });
});

