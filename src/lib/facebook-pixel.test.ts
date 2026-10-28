import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import {
  cartContents,
  orderContents,
  trackInitiateCheckout,
  trackPurchaseOnce,
} from "@/lib/facebook-pixel";
import type { CartItem, OrderItem } from "@/types";

// The pixel's global is what every helper ultimately calls, so each test spies
// on window.fbq and asserts on the payload Meta would receive.

const cartItem = (over: Partial<CartItem> = {}): CartItem => ({
  productId: "prod-1",
  productName: "Jollof Base",
  variantLabel: "Small",
  prepOption: "Rough blend",
  quantity: 2,
  unitPriceNgn: 3000,
  subtotalNgn: 6000,
  ...over,
});

const orderItem = (over: Partial<OrderItem> = {}): OrderItem => ({
  id: "oi-1",
  order_id: "o-1",
  product_id: "prod-1",
  product_name: "Jollof Base",
  variant_label: "Small",
  prep_option: "Rough blend",
  quantity: 2,
  unit_price_ngn: 3000,
  subtotal_ngn: 6000,
  ...over,
});

describe("facebook-pixel", () => {
  let fbqSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fbqSpy = vi.fn();
    window.fbq = fbqSpy;
    window.localStorage.clear();
  });

  afterEach(() => {
    delete window.fbq;
  });

  describe("content mapping", () => {
    it("folds variant and prep into the content id so prep variants stay distinct", () => {
      expect(cartContents([cartItem()])).toEqual([
        { id: "prod-1|Small|Rough blend", quantity: 2, item_price: 3000 },
      ]);
    });

    it("omits absent variant and prep rather than emitting empty segments", () => {
      expect(
        cartContents([cartItem({ variantLabel: null, prepOption: null })]),
      ).toEqual([{ id: "prod-1", quantity: 2, item_price: 3000 }]);
    });

    it("maps order items (snake_case) to the same id shape as cart items", () => {
      expect(orderContents([orderItem()])[0].id).toBe(
        cartContents([cartItem()])[0].id,
      );
    });
  });

  describe("trackInitiateCheckout", () => {
    it("reports cart value and total item count", () => {
      trackInitiateCheckout([
        cartItem(),
        cartItem({ productId: "prod-2", quantity: 1, subtotalNgn: 1500 }),
      ]);

      const [event, name, payload] = fbqSpy.mock.calls[0];
      expect(event).toBe("track");
      expect(name).toBe("InitiateCheckout");
      expect(payload).toMatchObject({
        value: 7500,
        num_items: 3,
        currency: "NGN",
      });
    });
  });

  describe("trackPurchaseOnce", () => {
    const purchase = { reference: "REF-1", totalNgn: 8500, items: [orderItem()] };

    it("reports the order total, not the sum of line subtotals", () => {
      expect(trackPurchaseOnce(purchase)).toBe(true);

      const [event, name, payload] = fbqSpy.mock.calls[0];
      expect(event).toBe("track");
      expect(name).toBe("Purchase");
      expect(payload).toMatchObject({
        value: 8500,
        currency: "NGN",
        num_items: 2,
      });
    });

    it("drops a repeat of the same reference — a page refresh must not double revenue", () => {
      trackPurchaseOnce(purchase);
      fbqSpy.mockClear();

      expect(trackPurchaseOnce(purchase)).toBe(false);
      expect(fbqSpy).not.toHaveBeenCalled();
    });

    it("still reports a different order in the same browser", () => {
      trackPurchaseOnce(purchase);
      expect(trackPurchaseOnce({ ...purchase, reference: "REF-2" })).toBe(true);
      expect(fbqSpy).toHaveBeenCalledTimes(2);
    });

    it("survives a reload: dedupe state is read back from localStorage", async () => {
      trackPurchaseOnce(purchase);
      vi.resetModules();
      const reloaded = await import("@/lib/facebook-pixel");

      expect(reloaded.trackPurchaseOnce(purchase)).toBe(false);
    });

    it("reports rather than silently dropping when storage is unavailable", () => {
      const getItem = vi
        .spyOn(window.localStorage, "getItem")
        .mockImplementation(() => {
          throw new Error("storage blocked");
        });
      const setItem = vi
        .spyOn(window.localStorage, "setItem")
        .mockImplementation(() => {
          throw new Error("storage blocked");
        });

      expect(trackPurchaseOnce(purchase)).toBe(true);

      getItem.mockRestore();
      setItem.mockRestore();
    });

    it("ignores a corrupted dedupe key instead of throwing", () => {
      window.localStorage.setItem("rodo-fb-purchases", "not-json");
      expect(trackPurchaseOnce(purchase)).toBe(true);
    });
  });
});
