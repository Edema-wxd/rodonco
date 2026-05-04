import type { NextConfig } from "next";

import { validateEnv } from "@/lib/validateEnv";

// Run env assertion at build time (and at dev server start).
// Throws with a descriptive message if required vars are missing or malformed.
// DATABASE_URL is intentionally not asserted here (not reliably available at next build time).
validateEnv();

const nextConfig: NextConfig = {
  async headers() {
    return [
      {
        source: "/(.*)",
        headers: [
          { key: "X-Frame-Options", value: "DENY" },
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          {
            key: "Permissions-Policy",
            value: "camera=(), microphone=(), geolocation=()",
          },
          {
            // CSP: permissive at launch — tighten with nonces post-launch.
            // MUST keep Paystack and UploadThing origins or Phase 5 payment and Phase 4 uploads break.
            // See LAUNCH-CHECKLIST.md for post-launch CSP tightening guidance.
            key: "Content-Security-Policy",
            value: [
              "default-src 'self'",
              // Next.js 15 App Router requires unsafe-inline + unsafe-eval for inline scripts.
              // Tighten with nonce-based CSP post-launch.
              "script-src 'self' 'unsafe-inline' 'unsafe-eval' https://js.paystack.co",
              "style-src 'self' 'unsafe-inline'",
              // utfs.io = UploadThing CDN for product images (Phase 4)
              "img-src 'self' blob: data: https://utfs.io",
              "connect-src 'self' https://api.paystack.co https://api.resend.com",
              // Paystack inline popup loads in a frame
              "frame-src https://js.paystack.co",
              "object-src 'none'",
              "base-uri 'self'",
            ].join("; "),
          },
        ],
      },
    ];
  },
};

export default nextConfig;
