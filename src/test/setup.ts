import { afterEach, beforeEach } from "vitest";
import { cleanup } from "@testing-library/react";

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

afterEach(() => {
  // Unmount all rendered components after each test to prevent DOM leakage.
  cleanup();
});

// jsdom doesn't implement PointerEvent (used by Radix UI / shadcn Checkbox)
if (typeof globalThis.PointerEvent === "undefined") {
  class PointerEvent extends MouseEvent {
    public readonly pointerId: number;
    public readonly width: number;
    public readonly height: number;
    public readonly pressure: number;
    public readonly tangentialPressure: number;
    public readonly tiltX: number;
    public readonly tiltY: number;
    public readonly twist: number;
    public readonly pointerType: string;
    public readonly isPrimary: boolean;

    constructor(type: string, params: PointerEventInit = {}) {
      super(type, params);
      this.pointerId = params.pointerId ?? 0;
      this.width = params.width ?? 1;
      this.height = params.height ?? 1;
      this.pressure = params.pressure ?? 0;
      this.tangentialPressure = params.tangentialPressure ?? 0;
      this.tiltX = params.tiltX ?? 0;
      this.tiltY = params.tiltY ?? 0;
      this.twist = params.twist ?? 0;
      this.pointerType = params.pointerType ?? "mouse";
      this.isPrimary = params.isPrimary ?? false;
    }
  }
  (globalThis as any).PointerEvent = PointerEvent;
}

