import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { CartItem } from "@/types";

interface CartStore {
  items: CartItem[];
  addItem: (item: CartItem) => void;
  removeItem: (productId: string, variantLabel: string | null) => void;
  updateQuantity: (
    productId: string,
    variantLabel: string | null,
    qty: number
  ) => void;
  clearCart: () => void;
}

export const useCartStore = create<CartStore>()(
  persist(
    (set) => ({
      items: [],

      addItem: (item) =>
        set((state) => {
          const existing = state.items.find(
            (i) =>
              i.productId === item.productId &&
              i.variantLabel === item.variantLabel &&
              i.prepOption === item.prepOption
          );
          if (existing) {
            return {
              items: state.items.map((i) =>
                i.productId === item.productId &&
                i.variantLabel === item.variantLabel &&
                i.prepOption === item.prepOption
                  ? {
                      ...i,
                      quantity: i.quantity + item.quantity,
                      subtotalNgn:
                        (i.quantity + item.quantity) * i.unitPriceNgn,
                    }
                  : i
              ),
            };
          }
          return { items: [...state.items, item] };
        }),

      removeItem: (productId, variantLabel) =>
        set((state) => ({
          items: state.items.filter(
            (i) =>
              !(
                i.productId === productId && i.variantLabel === variantLabel
              )
          ),
        })),

      updateQuantity: (productId, variantLabel, qty) =>
        set((state) => ({
          items:
            qty <= 0
              ? state.items.filter(
                  (i) =>
                    !(
                      i.productId === productId &&
                      i.variantLabel === variantLabel
                    )
                )
              : state.items.map((i) =>
                  i.productId === productId && i.variantLabel === variantLabel
                    ? { ...i, quantity: qty, subtotalNgn: qty * i.unitPriceNgn }
                    : i
                ),
        })),

      clearCart: () => set({ items: [] }),
    }),
    { name: "rodo-cart" }
  )
);
