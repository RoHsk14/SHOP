import { NextRequest, NextResponse } from "next/server";

// Initier la connexion OAuth Google
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sheetUrl = searchParams.get("sheet_url") || "";
  const shopSlug = searchParams.get("shop_slug") || "";

  const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const defaultBaseUrl = `${protocol}://${host}`;
  const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || defaultBaseUrl;

  if (!GOOGLE_CLIENT_ID) {
    return NextResponse.json(
      { error: "Google OAuth non configuré. GOOGLE_CLIENT_ID manquant dans les variables d'environnement." },
      { status: 500 }
    );
  }

  const REDIRECT_URI = `${BASE_URL}/api/google-sheets-callback`;

  const scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/drive.file",
    "https://www.googleapis.com/auth/userinfo.email"
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", JSON.stringify({ sheetUrl, shopSlug, mode: "popup" }));

  return NextResponse.redirect(authUrl.toString());
}
