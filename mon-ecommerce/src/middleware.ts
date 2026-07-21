import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Never rewrite API / Next internals / static assets
  if (
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/boutiques") ||
    /\.\w+$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  const rawHost = request.headers.get("host") || "";
  const host = rawHost.replace(/:\d+$/, "");
  let subdomain: string | null = null;

  const parts = host.split(".");
  if (parts.length > 2) {
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
