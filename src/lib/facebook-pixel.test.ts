import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

import { trackLead } from "@/lib/facebook-pixel";

// The pixel's global is what every helper ultimately calls, so each test spies
// on window.fbq and asserts on the payload Meta would receive.

describe("facebook-pixel", () => {
  let fbqSpy: ReturnType<typeof vi.fn>;

  beforeEach(() => {
    fbqSpy = vi.fn();
    window.fbq = fbqSpy;
  });

  afterEach(() => {
    delete window.fbq;
  });

  describe("trackLead", () => {
    it("reports a Lead tagged with its source", () => {
      trackLead("Waitlist");

      expect(fbqSpy).toHaveBeenCalledWith("track", "Lead", {
        content_name: "Waitlist",
      });
    });

    it("no-ops when the pixel hasn't loaded", () => {
      delete window.fbq;
      expect(() => trackLead("Waitlist")).not.toThrow();
    });
  });
});
