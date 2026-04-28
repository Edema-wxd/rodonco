// src/types/env.d.ts
// All environment variables required by Rodo & Co. Keep in sync with .env.local.example.
// NEXT_PUBLIC_* are safe in client bundles. Everything else is server-only.

declare namespace NodeJS {
  interface ProcessEnv {
    // ── Public (browser-safe) ──
    NEXT_PUBLIC_PAYSTACK_PUBLIC_KEY: string;
    NEXT_PUBLIC_APP_URL: string;

    // ── Server-only (NEVER prefix with NEXT_PUBLIC_) ──
    DATABASE_URL: string;
    DIRECT_DATABASE_URL: string;
    AUTH_SECRET: string;
    AUTH_URL?: string;
    UPLOADTHING_TOKEN: string;
    PAYSTACK_SECRET_KEY: string;
    PAYSTACK_WEBHOOK_SECRET: string;
    RESEND_API_KEY: string;
    RESEND_FROM_EMAIL: string;
    ADMIN_NOTIFICATION_EMAIL: string;
    ADMIN_EMAIL: string;
    ADMIN_PASSWORD: string;
    CRON_SECRET: string;

    // ── Standard Node ──
    NODE_ENV: "development" | "test" | "production";
  }
}

export {};
