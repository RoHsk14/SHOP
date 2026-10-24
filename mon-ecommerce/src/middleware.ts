import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never rewrite API / Next internals / static assets / boutique routes
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/boutiques") ||
    /\.\w+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Platform routes that must always resolve at root level
  const platformRoutes = [
    "/privacy",
    "/politique-de-confidentialite",
    "/terms",
    "/conditions-d-utilisation",
    "/login",
    "/signup",
    "/auth",
    "/admin",
    "/logos",
  ];

  if (platformRoutes.some((route) => pathname === route || pathname.startsWith(route + "/"))) {
    return NextResponse.next();
  }

  const rawHost = request.headers.get("host") || "";
  const host = rawHost.replace(/:\d+$/, "");
  let subdomain: string | null = null;

  const parts = host.split(".");
  if (host.endsWith(".vercel.app")) {
    if (parts.length > 3) {
      subdomain = parts[0];
    }
  } else if (parts.length > 2) {
    subdomain = parts[0];
  } else if (parts.length === 2 && parts[1] === "localhost") {
    subdomain = parts[0];
  }

  if (subdomain === "www") {
    subdomain = null;
  }

  if (subdomain) {
    const url = request.nextUrl.clone();
    url.pathname = `/boutiques/${subdomain}${pathname}`;
    return NextResponse.rewrite(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|boutiques|favicon\\.ico|.*\\.[\\w]+$).*)"],
};

