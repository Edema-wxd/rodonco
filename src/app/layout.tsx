import type { Metadata } from "next";
import { SpeedInsights } from "@vercel/speed-insights/next";
import AnnouncementBanner from "@/components/AnnouncementBanner";
import "./globals.css";

export const metadata: Metadata = {
  title: "Coming Soon",
  description: "We are cooking for you.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-dvh flex flex-col">
        <AnnouncementBanner />
        {children}
        <SpeedInsights />
      </body>
    </html>
  );
}
