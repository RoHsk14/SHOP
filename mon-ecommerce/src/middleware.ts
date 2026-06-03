import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // ── 1. Host brut ──
  const rawHost = request.headers.get("host") || "";
  console.log("[DEBUG] Host brut:", rawHost);

  // ── 2. Nettoyage du port ──
  const host = rawHost.replace(/:\d+$/, "");
  console.log("[DEBUG] Host sans port:", host);

  // ── 3. Sous-domaine (détecté avant les guardrails) ──
  let subdomain: string | null = null;

  const parts = host.split(".");
  if (parts.length > 2) {
    // Si on a plus de 2 parties (ex: boutique.shopeazy.com), la première partie est le sous-domaine
    subdomain = parts[0];
  } else if (parts.length === 2 && parts[1] === "localhost") {
    // Cas spécial pour sous.localhost
    subdomain = parts[0];
  }

  // Ignorer 'www' comme sous-domaine
  if (subdomain === "www") {
    subdomain = null;
  }

  console.log("[DEBUG] Sous-domaine:", subdomain);

  // ── 4. Guardrails ──

  // 4a. Anti-boucle : déjà sous /boutiques
  if (pathname.startsWith("/boutiques")) {
    return NextResponse.next();
  }
  // 4b. Sous-domaine actif → on rewrite même la racine
  if (subdomain && !subdomain.match(/^www$/)) {
    const url = request.nextUrl.clone();
    url.pathname = `/boutiques/${subdomain}${pathname}`;
    console.log("[DEBUG] URL réécrite (sous-domaine):", url.pathname);
    return NextResponse.rewrite(url);
  }
  // 4c. Routes racine (login, signup, auth callback, landing)
  if (pathname === "/" || pathname.startsWith("/login") || pathname.startsWith("/signup") || pathname.startsWith("/auth")) {
    return NextResponse.next();
  }
  // 4d. API et Next.js internes
  if (pathname.startsWith("/api") || pathname.startsWith("/_next")) {
    return NextResponse.next();
  }
  // 4e. Fichiers statiques
  if (/\.\w+$/.test(pathname)) {
    return NextResponse.next();
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next|boutiques|favicon\\.ico|.*\\.[\\w]+$).*)"],
};
