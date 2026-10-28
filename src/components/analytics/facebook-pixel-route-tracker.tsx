"use client";

import { useEffect, useRef } from "react";
import { usePathname } from "next/navigation";

import { fbq } from "@/lib/facebook-pixel";

/**
 * The base code only fires PageView on a full page load, so soft navigations
 * report their own.
 */
export function FacebookPixelRouteTracker() {
  const pathname = usePathname();
  const isFirstRender = useRef(true);

  useEffect(() => {
    if (isFirstRender.current) {
      isFirstRender.current = false;
      return;
    }
    fbq("track", "PageView");
  }, [pathname]);

  return null;
}
