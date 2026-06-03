import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

function popupHtml(success: boolean, shopSlug: string, errorMsg = "") {
  return `<!DOCTYPE html>
<html>
<head><meta charset="utf-8"><title>Fermeture...</title></head>
<body style="display:flex;align-items:center;justify-content:center;min-height:100vh;font-family:sans-serif;background:#f9fafb;margin:0">
<div style="text-align:center;padding:2rem">
  <div style="width:48px;height:48px;border-radius:50%;margin:0 auto 1rem;display:flex;align-items:center;justify-content:center;${success ? 'background:#d1fae5' : 'background:#fee2e2'}">
    ${success
      ? '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>'
      : '<svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'}
  </div>
  <p style="color:#374151;font-size:14px;font-weight:500">${success ? 'Connexion réussie !' : 'Erreur : ' + errorMsg}</p>
  <p style="color:#9ca3af;font-size:12px">Cette fenêtre va se fermer...</p>
</div>
<script>
  if (window.opener) {
    window.opener.postMessage({ type: 'google-oauth', success: ${success}, shopSlug: '${shopSlug}', error: '${errorMsg.replace(/'/g, "\\'")}' }, '*');
  }
  setTimeout(() => window.close(), 1500);
</script>
</body>
</html>`;
}

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const code = searchParams.get("code");
  const error = searchParams.get("error");
  const stateParam = searchParams.get("state") || "{}";

  let stateData: { sheetUrl?: string; shopSlug?: string; mode?: string } = {};
  try { stateData = JSON.parse(stateParam); } catch { stateData = {}; }
  
  const shopSlug = stateData.shopSlug || stateParam;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";
  const isPopup = stateData.mode === "popup";

  if (error) {
    const html = popupHtml(false, shopSlug, "google_oauth_denied");
    if (isPopup) return new NextResponse(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    return NextResponse.redirect(`${baseUrl}/boutiques/${shopSlug}/admin/settings?error=google_oauth_denied`);
  }

  if (!code) {
    const html = popupHtml(false, shopSlug, "no_code");
    if (isPopup) return new NextResponse(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    return NextResponse.redirect(`${baseUrl}/boutiques/${shopSlug}/admin/settings?error=no_code`);
  }

  try {
    if (!shopSlug) {
      const html = popupHtml(false, "", "no_shop_slug");
      if (isPopup) return new NextResponse(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
      return NextResponse.redirect(`${baseUrl}/login?error=no_shop_slug`);
    }

    const supabase = createSupabaseServerClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      const html = popupHtml(false, shopSlug, "not_authenticated");
      if (isPopup) return new NextResponse(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
      return NextResponse.redirect(`${baseUrl}/boutiques/${shopSlug}/admin/settings?error=not_authenticated`);
    }

    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      const html = popupHtml(false, shopSlug, "OAuth non configuré sur l'application");
      if (isPopup) return new NextResponse(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
      return NextResponse.redirect(`${baseUrl}/boutiques/${shopSlug}/admin/settings?error=oauth_not_configured`);
    }

    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: `${baseUrl}/api/google-sheets-callback`,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error(tokens.error_description || "Failed to get access token");
    }

    const { error: dbError } = await supabase
      .from("settings")
      .update({
        google_access_token: tokens.access_token,
        google_refresh_token: tokens.refresh_token || null,
        updated_at: new Date().toISOString(),
      })
      .eq("shop_slug", shopSlug);

    if (dbError) throw dbError;

    if (isPopup) {
      return new NextResponse(popupHtml(true, shopSlug), {
        headers: { "Content-Type": "text/html;charset=utf-8" },
      });
    }
    return NextResponse.redirect(`${baseUrl}/boutiques/${shopSlug}/admin/settings?success=google_connected`);
  } catch (error: any) {
    console.error("OAuth callback error:", error);
    const html = popupHtml(false, shopSlug || "", error.message);
    if (isPopup) return new NextResponse(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    return NextResponse.redirect(`${baseUrl}/boutiques/${shopSlug || ""}/admin/settings?error=${encodeURIComponent(error.message)}`);
  }
}
