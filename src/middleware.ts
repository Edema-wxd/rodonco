import { NextResponse } from "next/server";
import { auth } from "@/auth";

const ADMIN_HOSTNAME = "admin.rodoandco.com";

export default auth((req) => {
  const hostname = req.headers.get("host") ?? "";
  const { pathname } = req.nextUrl;
  const isAdminSubdomain = hostname === ADMIN_HOSTNAME;

  if (isAdminSubdomain) {
    // API routes pass through unchanged so webhooks/auth endpoints still work
    if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
      return NextResponse.next();
    }

    // Map subdomain paths to internal /admin paths
    const internalPath =
      pathname === "/"
        ? "/admin"
        : pathname.startsWith("/admin")
        ? pathname
        : `/admin${pathname}`;

    // Require auth for everything except the login page (/admin)
    if (internalPath !== "/admin" && !req.auth) {
      const loginUrl = new URL("/", req.nextUrl.origin);
      loginUrl.searchParams.set("expired", "1");
      const res = NextResponse.redirect(loginUrl);
      res.headers.set("Cache-Control", "no-store");
      return res;
    }

    // Rewrite to the internal /admin path if it changed
    if (internalPath !== pathname) {
      const rewriteUrl = req.nextUrl.clone();
      rewriteUrl.pathname = internalPath;
      return NextResponse.rewrite(rewriteUrl);
    }

    return NextResponse.next();
  }

  // On non-local deployments, redirect /admin/* on the main domain to the admin subdomain
  const isLocalhost =
    hostname.startsWith("localhost") || hostname.startsWith("127.0.0.1");

  if (!isLocalhost && pathname.startsWith("/admin")) {
    const adminUrl = new URL(`https://${ADMIN_HOSTNAME}${pathname}`);
    adminUrl.search = req.nextUrl.search;
    return NextResponse.redirect(adminUrl.toString());
  }

  // Local dev: keep the original /admin auth guard
  const isAdminLanding = pathname === "/admin";
  if (pathname.startsWith("/admin") && !isAdminLanding && !req.auth) {
    const loginUrl = new URL("/admin", req.nextUrl.origin);
    loginUrl.searchParams.set("expired", "1");
    const res = NextResponse.redirect(loginUrl);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  return NextResponse.next();
});

export const config = {
  // Match all routes except Next.js static assets
  matcher: ["/((?!_next/static|_next/image|favicon\\.ico).*)"],
};
