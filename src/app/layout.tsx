import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import { NextSSRPlugin } from "@uploadthing/react/next-ssr-plugin";
import "./globals.css";
import { Quicksand } from "next/font/google";
import { extractRouterConfig } from "uploadthing/server";

import { ourFileRouter } from "@/app/api/uploadthing/core";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";

const quicksand = Quicksand({
  subsets: ["latin"],
  variable: "--font-quicksand",
  display: "swap",
});

export const metadata: Metadata = {
  title: "rodo&co — Preps fresh produce + ready-to-cook kits in Lagos",
  description:
    "Shop fresh produce prepped your way and ready-to-cook kits in Lagos. Rodo & Co. makes meal prep easier with clean, sorted and prepped ingredients delivered to you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={quicksand.variable}>
      <body>
        <NextSSRPlugin routerConfig={extractRouterConfig(ourFileRouter)} />
        {children}
        <Toaster richColors position="bottom-center" />
        <SpeedInsights />
      </body>
    </html>
  );
}
