import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// Google OAuth callback
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?error=google_oauth_denied`);
  }

  if (!code) {
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?error=no_code`);
  }

  try {
    // Exchange code for tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: process.env.GOOGLE_CLIENT_ID!,
        client_secret: process.env.GOOGLE_CLIENT_SECRET!,
        redirect_uri: `${process.env.NEXT_PUBLIC_BASE_URL}/api/google-sheets-callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();
    
    if (!tokens.access_token) {
      throw new Error("Failed to get access token");
    }

    // Get user's sheets
    const sheetsResponse = await fetch(
      "https://sheets.googleapis.com/v4/spreadsheets",
      {
        headers: { Authorization: `Bearer ${tokens.access_token}` },
      }
    );

    // Save tokens to settings
    const { error: dbError } = await supabase
      .from("settings")
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token,
        updated_at: new Date().toISOString(),
      })
      .eq("id", (await supabase.from("settings").select("id").single()).data?.id || "");

    if (dbError) throw dbError;

    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?success=google_connected`);
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    return NextResponse.redirect(`${process.env.NEXT_PUBLIC_BASE_URL}/admin/settings?error=${error.message}`);
  }
}
