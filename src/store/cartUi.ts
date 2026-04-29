import { create } from "zustand";
import { persist } from "zustand/middleware";

interface CartUiStore {
  isOpen: boolean;
  hasAutoOpened: boolean;
  openCart: () => void;
  closeCart: () => void;
  toggleCart: () => void;
  autoOpenOnFirstAdd: () => void;
}

export const useCartUiStore = create<CartUiStore>()(
  persist(
    (set, get) => ({
      isOpen: false,
      hasAutoOpened: false,
      openCart: () => set({ isOpen: true }),
      closeCart: () => set({ isOpen: false }),
      toggleCart: () => set((s) => ({ isOpen: !s.isOpen })),
      autoOpenOnFirstAdd: () => {
        const { hasAutoOpened } = get();
        if (hasAutoOpened) return;
        set({ isOpen: true, hasAutoOpened: true });
      },
    }),
    {
      name: "rodo-cart-ui",
      partialize: (state) => ({ hasAutoOpened: state.hasAutoOpened }),
    }
  )
);
