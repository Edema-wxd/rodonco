declare module "vitest" {
  // Minimal type-only surface so `tsc --noEmit` can run without installing Vitest.
  // Runtime Vitest is only needed when executing the test suite.
  export function beforeEach(cb: () => unknown): void;
  export function describe(name: string, cb: () => unknown): void;
  export function it(name: string, cb: () => unknown): void;

  // Keep `expect` intentionally loose; tests use matchers like `toBe` / `toHaveLength`.
  export function expect(value: unknown): any;
}

declare module "vitest/config" {
  export function defineConfig(config: unknown): unknown;
}

