import { beforeEach } from "vitest";

function ensureLocalStorage() {
  const existing = (globalThis as any).localStorage ?? (globalThis as any).window?.localStorage;
  const hasRequiredApi =
    existing &&
    typeof existing.getItem === "function" &&
    typeof existing.setItem === "function" &&
    typeof existing.removeItem === "function";

  if (hasRequiredApi) return;

  const backing = new Map<string, string>();

  const polyfill: Storage = {
    get length() {
      return backing.size;
    },
    clear: () => {
      backing.clear();
    },
    getItem: (name: string) => {
      const v = backing.get(name);
      return v === undefined ? null : v;
    },
    key: (index: number) => {
      return Array.from(backing.keys())[index] ?? null;
    },
    removeItem: (name: string) => {
      backing.delete(name);
    },
    setItem: (name: string, value: string) => {
      backing.set(name, value);
    },
  };

  (globalThis as any).localStorage = polyfill;
  if ((globalThis as any).window) {
    (globalThis as any).window.localStorage = polyfill;
  }
}

ensureLocalStorage();

beforeEach(() => {
  // Zustand `persist` writes to localStorage; clear it to avoid cross-test leakage.
  (globalThis as any).localStorage?.clear?.();
});

