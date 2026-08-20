/**
 * CheckoutExperience tests
 *
 * Strategy:
 *  - Mock the Zustand cart store to control cart state.
 *  - Mock next/navigation router.push for redirect assertions.
 *  - Mock @paystack/inline-js to avoid DOM/iframe concerns in jsdom.
 *  - Mock fetch for /api/orders/init.
 *  - Mock sonner toast to assert cancellation notification.
 *
 * CHKT-01: two-column layout (form + cart summary) renders when cart has items.
 * CHKT-03: empty cart triggers redirect to /shop.
 * D-03: Pay Now disabled + spinner while init in-flight.
 * D-04: cancellation toast shown when Paystack popup cancelled.
 * D-08: cart cleared and router pushed to /order/[ref] on success.
 */

import React from "react";
import {
  describe,
  it,
  expect as _expect,
  vi,
  beforeEach,
  afterEach,
} from "vitest";
import {
  render,
  screen,
  fireEvent,
  waitFor,
  act,
} from "@testing-library/react";

// Re-export with relaxed type so objectContaining / any / anything compile cleanly.
// The runtime object is the real vitest expect; the cast is purely cosmetic for tsc.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const expect = _expect as any;
import type { CartItem } from "@/types";

// ── Hoisted mock references (must be declared before vi.mock calls) ───────────

const {
  mockPush,
  mockToast,
  mockResumeTransaction,
  mockClearCart,
  mockCartItemsRef,
  mockHasHydratedRef,
} = vi.hoisted(() => {
  let capturedCallbacks: Record<string, (arg?: unknown) => void> = {};

  const mockResumeTransaction = vi.fn(
    (
      _accessCode: string,
      callbacks: Record<string, (arg?: unknown) => void>,
    ) => {
      capturedCallbacks = callbacks;
    },
  );

  // Expose capturedCallbacks via the resumeTransaction fn itself for tests
  (mockResumeTransaction as any).__getCallbacks = () => capturedCallbacks;
  (mockResumeTransaction as any).__resetCallbacks = () => {
    capturedCallbacks = {};
  };

  return {
    mockPush: vi.fn(),
    mockToast: vi.fn(),
    mockResumeTransaction,
    mockClearCart: vi.fn(),
    // mutable refs so tests can change cart/hydration state
    mockCartItemsRef: { current: [] as CartItem[] },
    mockHasHydratedRef: { current: true },
  };
});

// ── vi.mock declarations ──────────────────────────────────────────────────────

vi.mock("next/navigation", () => ({
  useRouter: () => ({ push: mockPush }),
}));

vi.mock("sonner", () => ({
  toast: mockToast,
}));

vi.mock("@paystack/inline-js", () => ({
  // Must use regular function — arrow fns can't be called with `new` in Vitest 4.x.
  default: vi.fn(function (this: {
    resumeTransaction: typeof mockResumeTransaction;
  }) {
    this.resumeTransaction = mockResumeTransaction;
  }),
}));

vi.mock("@/store/cart", () => ({
  useCartStore: (
    selector: (state: { items: CartItem[]; clearCart: () => void }) => unknown,
  ) => selector({ items: mockCartItemsRef.current, clearCart: mockClearCart }),
}));

vi.mock("@/hooks/useHasHydrated", () => ({
  useHasHydrated: () => mockHasHydratedRef.current,
}));

// ── Import component AFTER mocks ──────────────────────────────────────────────
import { CheckoutExperience } from "./CheckoutExperience";

// ── Helpers ───────────────────────────────────────────────────────────────────

const sampleCartItems: CartItem[] = [
  {
    productId: "prod-1",
    productName: "Organic Tomatoes",
    variantLabel: null,
    prepOption: "Diced",
    quantity: 2,
    unitPriceNgn: 1500, // ₦1,500
    subtotalNgn: 3000, // ₦3,000 (2 × ₦1,500)
  },
  {
    productId: "prod-2",
    productName: "Cooking Kit A",
    variantLabel: "Family (4 people)",
    prepOption: null,
    quantity: 1,
    unitPriceNgn: 8000, // ₦8,000
    subtotalNgn: 8000,
  },
];

function getCapturedCallbacks() {
  return (mockResumeTransaction as any).__getCallbacks() as Record<
    string,
    (arg?: unknown) => void
  >;
}

function renderCheckout() {
  return render(
    <CheckoutExperience
      deliveryFeeNgn={0}
      deliveryZones={[]}
      whatsappNumber={null}
    />,
  );
}

// Fills step-1 form and clicks "Continue to Payment", waits for step-2 "Pay Now" button.
// Caller must set up global.fetch before calling renderCheckout — first call is the draft save.
async function fillAndAdvanceToPayment(
  user = {
    name: "Tunde Bakare",
    phone: "07011223344",
    email: "tunde@example.com",
    address: "22 Allen Avenue, Ikeja, Lagos",
  },
) {
  fireEvent.change(screen.getByLabelText(/full name/i), {
    target: { value: user.name },
  });
  fireEvent.change(screen.getByLabelText(/phone/i), {
    target: { value: user.phone },
  });
  fireEvent.change(screen.getByLabelText(/email/i), {
    target: { value: user.email },
  });
  fireEvent.change(screen.getByLabelText(/delivery address/i), {
    target: { value: user.address },
  });
  fireEvent.click(screen.getByRole("checkbox"));
  fireEvent.click(screen.getByRole("button", { name: /continue to payment/i }));
  await waitFor(() => {
    expect(screen.getByRole("button", { name: /pay now/i })).toBeTruthy();
  });
}

// Factory — Response bodies are streams; each fetch call needs a fresh object.
function makeDraftOk() {
  return new Response(JSON.stringify({}), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}

// ── Setup / teardown ──────────────────────────────────────────────────────────

// Get the mocked PaystackPop constructor from the module
import PaystackPopMock from "@paystack/inline-js";

beforeEach(() => {
  vi.resetAllMocks();
  mockCartItemsRef.current = [...sampleCartItems];
  mockHasHydratedRef.current = true;

  // Re-wire resumeTransaction after resetAllMocks clears implementations
  mockResumeTransaction.mockImplementation(
    (
      _accessCode: string,
      callbacks: Record<string, (arg?: unknown) => void>,
    ) => {
      (mockResumeTransaction as any).__capturedCallbacks = callbacks;
    },
  );

  // Re-wire PaystackPop constructor after resetAllMocks — regular function required for `new`.
  (PaystackPopMock as unknown as ReturnType<typeof vi.fn>).mockImplementation(
    function (this: { resumeTransaction: typeof mockResumeTransaction }) {
      this.resumeTransaction = mockResumeTransaction;
    },
  );

  vi.stubEnv("NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY", "pk_test_abc123");
});

afterEach(() => {
  vi.unstubAllEnvs();
});

// Helper that reads the last captured callbacks
function getCallbacks() {
  return (mockResumeTransaction as any).__capturedCallbacks as
    | Record<string, (arg?: unknown) => void>
    | undefined;
}

// ── Tests ─────────────────────────────────────────────────────────────────────

describe("CheckoutExperience — layout and cart summary", () => {
  it("renders the checkout form with all required fields when cart has items", () => {
    renderCheckout();

    expect(screen.getByLabelText(/full name/i)).toBeTruthy();
    expect(screen.getByLabelText(/phone/i)).toBeTruthy();
    expect(screen.getByLabelText(/email/i)).toBeTruthy();
    expect(screen.getByLabelText(/delivery address/i)).toBeTruthy();
    expect(screen.getByRole("checkbox")).toBeTruthy();
    expect(
      screen.getByRole("button", { name: /continue to payment/i }),
    ).toBeTruthy();
  });

  it("renders cart summary with correct item names and total", () => {
    renderCheckout();

    expect(screen.getByText("Your Order")).toBeTruthy();
    expect(screen.getByText("Organic Tomatoes")).toBeTruthy();
    expect(screen.getByText("Cooking Kit A")).toBeTruthy();
    // Subtotal and total are both ₦11,000 when delivery is free
    expect(screen.getAllByText(/11,000/).length).toBeGreaterThan(0);
  });

  it("shows prep option as secondary text when present", () => {
    renderCheckout();
    expect(screen.getByText("Diced")).toBeTruthy();
  });

  it("shows variant label when present", () => {
    renderCheckout();
    expect(screen.getByText(/Family \(4 people\)/i)).toBeTruthy();
  });

  it("shows delivery row in cart summary (Free when no delivery fee)", () => {
    renderCheckout();
    expect(screen.getByText("Delivery")).toBeTruthy();
    expect(screen.getByText("Free")).toBeTruthy();
  });
});

describe("CheckoutExperience — empty cart redirect", () => {
  it("redirects to /shop when cart is empty after hydration", async () => {
    mockCartItemsRef.current = [];
    mockHasHydratedRef.current = true;

    renderCheckout();

    await waitFor(() => {
      expect(mockPush).toHaveBeenCalledWith("/shop");
    });
  });

  it("does not redirect before hydration completes", () => {
    mockCartItemsRef.current = [];
    mockHasHydratedRef.current = false;

    renderCheckout();

    expect(mockPush).not.toHaveBeenCalled();
  });
});

describe("CheckoutExperience — Pay Now loading state (D-03)", () => {
  it("disables Pay Now and shows Processing... while init in-flight", async () => {
    let resolveInit!: (value: Response) => void;
    const initPending = new Promise<Response>((resolve) => {
      resolveInit = resolve;
    });

    // Draft (1st fetch) resolves immediately; init (2nd fetch) stays pending.
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeDraftOk())
      .mockReturnValueOnce(initPending);

    renderCheckout();
    await fillAndAdvanceToPayment({
      name: "Adaeze Obi",
      phone: "08012345678",
      email: "adaeze@example.com",
      address: "Isaac John Str, Ikeja, Lagos",
    });

    fireEvent.click(screen.getByRole("button", { name: /pay now/i }));

    await waitFor(() => {
      const btn = screen.getByRole("button", { name: /processing/i });
      expect(btn).toBeTruthy();
      expect(btn.hasAttribute("disabled")).toBe(true);
    });

    // Resolve so no hanging promise
    act(() => {
      resolveInit(
        new Response(JSON.stringify({ error: "test done" }), { status: 500 }),
      );
    });

    global.fetch = vi.fn();
  });
});

describe("CheckoutExperience — Paystack cancellation (D-04)", () => {
  it("shows cancellation toast and stays on page when Paystack popup cancelled", async () => {
    const initResponse = new Response(
      JSON.stringify({
        reference: "RDC-abc1234567",
        access_code: "acc_test_123",
        amount_kobo: 1100000,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeDraftOk())
      .mockResolvedValueOnce(initResponse);

    renderCheckout();
    await fillAndAdvanceToPayment();

    fireEvent.click(screen.getByRole("button", { name: /pay now/i }));

    await waitFor(() => {
      expect(mockResumeTransaction).toHaveBeenCalledWith(
        "acc_test_123",
        expect.objectContaining({ onCancel: expect.any(Function) }),
      );
    });

    const callbacks = getCallbacks();
    act(() => {
      callbacks?.onCancel?.();
    });

    expect(mockToast).toHaveBeenCalledWith(
      "Payment cancelled — your cart is still saved.",
      expect.anything(),
    );
    expect(mockPush).not.toHaveBeenCalled();
    expect(mockClearCart).not.toHaveBeenCalled();
  });
});

describe("CheckoutExperience — payment success (D-08)", () => {
  it("clears cart and redirects to /order/[ref] on Paystack success", async () => {
    const testRef = "RDC-xyz9876543";

    const initResponse = new Response(
      JSON.stringify({
        reference: testRef,
        access_code: "acc_success_456",
        amount_kobo: 1100000,
      }),
      { status: 200, headers: { "Content-Type": "application/json" } },
    );
    global.fetch = vi
      .fn()
      .mockResolvedValueOnce(makeDraftOk())
      .mockResolvedValueOnce(initResponse);

    renderCheckout();
    await fillAndAdvanceToPayment({
      name: "Ngozi Adeyemi",
      phone: "09099887766",
      email: "ngozi@example.com",
      address: "3 Marina Road, Lagos Island",
    });

    fireEvent.click(screen.getByRole("button", { name: /pay now/i }));

    await waitFor(() => {
      expect(mockResumeTransaction).toHaveBeenCalledWith(
        "acc_success_456",
        expect.objectContaining({ onSuccess: expect.any(Function) }),
      );
    });

    const callbacks = getCallbacks();
    // onSuccess is async (awaits the view-cookie server action before navigating).
    await act(async () => {
      await callbacks?.onSuccess?.({ reference: testRef });
    });

    expect(mockClearCart).toHaveBeenCalled();
    expect(mockPush).toHaveBeenCalledWith(`/order/${testRef}`);
  });
});
