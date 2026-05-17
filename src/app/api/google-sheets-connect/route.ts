import { NextRequest, NextResponse } from "next/server";

const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID!;
const REDIRECT_URI = `${process.env.NEXT_PUBLIC_BASE_URL}/api/google-sheets-connect/callback`;

// Initier la connexion OAuth
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const sheetUrl = searchParams.get("sheet_url") || "";

  const scopes = [
    "https://www.googleapis.com/auth/spreadsheets",
    "https://www.googleapis.com/auth/userinfo.email"
  ].join(" ");

  const authUrl = new URL("https://accounts.google.com/o/oauth2/v2/auth");
  authUrl.searchParams.set("client_id", GOOGLE_CLIENT_ID);
  authUrl.searchParams.set("redirect_uri", REDIRECT_URI);
  authUrl.searchParams.set("response_type", "code");
  authUrl.searchParams.set("scope", scopes);
  authUrl.searchParams.set("access_type", "offline");
  authUrl.searchParams.set("prompt", "consent");
  authUrl.searchParams.set("state", sheetUrl); // Passer l'URL du Sheet

  return NextResponse.redirect(authUrl.toString());
}
