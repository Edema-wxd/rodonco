declare module "vitest" {
  // Minimal type-only surface so `tsc --noEmit` can run without installing Vitest.
  // Runtime Vitest is only needed when executing the test suite.
  export function afterEach(cb: () => unknown): void;
  export function afterAll(cb: () => unknown): void;
  export function beforeEach(cb: () => unknown): void;
  export function beforeAll(cb: () => unknown): void;
  export function describe(name: string, cb: () => unknown): void;
  export function it(name: string, cb: () => unknown): void;
  export function test(name: string, cb: () => unknown): void;

  // Keep `expect` intentionally loose; tests use matchers like `toBe` / `toHaveLength`.
  export function expect(value: unknown): any;

  // Mocking utilities.
  export const vi: any;
}

declare module "vitest/config" {
  export function defineConfig(config: unknown): unknown;
}

declare module "vitest" {
  // Minimal type-only surface so `tsc --noEmit` can run without installing Vitest.
  // Runtime Vitest is only needed when executing the test suite.
  export function afterEach(cb: () => unknown): void;
  export function afterAll(cb: () => unknown): void;
  export function beforeEach(cb: () => unknown): void;
  export function beforeAll(cb: () => unknown): void;
  export function describe(name: string, cb: () => unknown): void;
  export function it(name: string, cb: () => unknown): void;
  export function test(name: string, cb: () => unknown): void;

  // Keep `expect` intentionally loose; tests use matchers like `toBe` / `toHaveLength`.
  export function expect(value: unknown): any;

  // Mocking utilities.
  export const vi: any;
}

declare module "vitest/config" {
  export function defineConfig(config: unknown): unknown;
}

