// Facebook pixel helpers. The base code lives in
// src/components/analytics/facebook-pixel.tsx and is only rendered on the
// waitlist page; this module is the typed surface events are tracked through.

export const FACEBOOK_PIXEL_ID = process.env.NEXT_PUBLIC_FACEBOOK_PIXEL_ID;

type Fbq = (...args: unknown[]) => void;

declare global {
  interface Window {
    fbq?: Fbq;
  }
}

/**
 * Thin wrapper around the pixel's global. Safe to call before the script has
 * loaded (the base code queues calls), when the pixel is disabled, and on the
 * server — all of which no-op.
 */
export function fbq(...args: Parameters<Fbq>) {
  if (typeof window === "undefined") return;
  window.fbq?.(...args);
}

/** Track one of Facebook's standard events, e.g. `Lead`. */
export function trackEvent(name: string, params?: Record<string, unknown>) {
  fbq("track", name, params);
}

/** Waitlist signup. */
export function trackLead(source: string) {
  trackEvent("Lead", { content_name: source });
}
