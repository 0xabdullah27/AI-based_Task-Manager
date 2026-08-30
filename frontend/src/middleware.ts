import { NextRequest, NextResponse } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Retrieve session cookie (checks standard and secure cookie names)
  const sessionCookie =
    getSessionCookie(request) ||
    request.cookies.get("better-auth.session_token")?.value ||
    request.cookies.get("__Secure-better-auth.session_token")?.value;

  const isAuthRoute = pathname === "/sign-in" || pathname === "/sign-up";
  const isDashboardRoute = pathname.startsWith("/dashboard");

  // 1. Unauthenticated user trying to access protected dashboard routes
  if (isDashboardRoute && !sessionCookie) {
    const signInUrl = new URL("/sign-in", request.url);
    signInUrl.searchParams.set("returnUrl", pathname);
    return NextResponse.redirect(signInUrl);
  }

  // 2. Authenticated user trying to access auth pages (sign-in / sign-up)
  if (isAuthRoute && sessionCookie) {
    return NextResponse.redirect(new URL("/dashboard", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Match all request paths except:
     * - api routes (/api/...)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico, icon.svg, public assets
     */
    "/((?!api|_next/static|_next/image|favicon.ico|icon.svg|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
};
