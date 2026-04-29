// Vitest is only needed when running the test suite. For `tsc --noEmit` verification
// (which happens before any tests are executed), we avoid importing `vitest`
// so the build doesn't depend on dev-dependency installation.
declare const beforeEach: (cb: () => unknown) => void;

beforeEach(() => {
  // Zustand `persist` writes to localStorage; clear it to avoid cross-test leakage.
  localStorage.clear();
});

