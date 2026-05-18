import { NextResponse } from "next/server";
import { auth } from "@/auth";

export default auth((req) => {
  const { pathname } = req.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLanding = pathname === "/admin";

  if (isAdminRoute && !isAdminLanding && !req.auth) {
    const loginUrl = new URL("/admin", req.nextUrl.origin);
    loginUrl.searchParams.set("expired", "1");
    const res = NextResponse.redirect(loginUrl);
    res.headers.set("Cache-Control", "no-store");
    return res;
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/admin/:path*"],
};
