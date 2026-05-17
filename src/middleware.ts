import type { NextRequest } from "next/server";
import { NextResponse } from "next/server";
import { getToken } from "next-auth/jwt";

export default async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;
  const isAdminRoute = pathname.startsWith("/admin");
  const isAdminLanding = pathname === "/admin";

  if (isAdminRoute && !isAdminLanding) {
    // Cryptographically verify the session JWT (prevents forged cookie-name bypass).
    // getToken returns null for missing or expired tokens.
    const token = await getToken({ req, secret: process.env.AUTH_SECRET });
    if (!token) {
      const loginUrl = new URL("/admin", req.nextUrl.origin);
      loginUrl.searchParams.set("expired", "1");
      return NextResponse.redirect(loginUrl);
    }
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/admin/:path*"],
};
