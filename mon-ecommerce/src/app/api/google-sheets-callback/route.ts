import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { extractSheetId, getServiceAccountEmail } from "@/lib/google-sheets";

interface PopupData {
  success: boolean;
  shopSlug: string;
  sheetUrl?: string;
  columns?: string[];
  errorMsg?: string;
}

function popupHtml(data: PopupData) {
  const { success, shopSlug, sheetUrl = "", columns = [], errorMsg = "" } = data;
  const payload = JSON.stringify({
    type: "google-oauth",
    success,
    shopSlug,
    sheetUrl,
    columns,
    error: errorMsg,
  });

  return `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8">
  <title>${success ? "Connexion Google réussie" : "Erreur de connexion"}</title>
  <meta name="viewport" content="width=device-width, initial-scale=1">
  <style>
    body {
      display: flex;
      align-items: center;
      justify-content: center;
      min-height: 100vh;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      background: #f8fafc;
      margin: 0;
      color: #0f172a;
    }
    .card {
      text-align: center;
      padding: 2.5rem 2rem;
      background: #ffffff;
      border-radius: 1rem;
      border: 1px solid #e2e8f0;
      box-shadow: 0 10px 25px -5px rgba(0,0,0,0.05);
      max-width: 400px;
      width: 90%;
    }
    .icon {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      margin: 0 auto 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      background: ${success ? "#dcfce7" : "#fee2e2"};
    }
    h2 {
      margin: 0 0 0.5rem;
      font-size: 1.125rem;
      font-weight: 700;
      color: ${success ? "#15803d" : "#b91c1c"};
    }
    p {
      margin: 0 0 1.25rem;
      font-size: 0.875rem;
      color: #64748b;
      line-height: 1.5;
    }
    .closing {
      font-size: 0.75rem;
      color: #94a3b8;
    }
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">
      ${
        success
          ? '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#16a34a" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>'
          : '<svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="#dc2626" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>'
      }
    </div>
    <h2>${success ? "Google Sheets connecté !" : "Échec de connexion"}</h2>
    <p>${
      success
        ? "Votre Google Sheet a été créé et synchronisé avec succès."
        : errorMsg || "Une erreur est survenue lors de la connexion."
    }</p>
    <div class="closing">Fermeture automatique de cette fenêtre...</div>
  </div>
  <script>
    try {
      if (window.opener) {
        window.opener.postMessage(${payload}, '*');
      }
    } catch (e) {
      console.error("postMessage error:", e);
    }
    setTimeout(function() {
      window.close();
    }, 1500);
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
  try {
    stateData = JSON.parse(stateParam);
  } catch {
    stateData = { shopSlug: stateParam };
  }

  const shopSlug = stateData.shopSlug || "";
  const initialSheetUrl = stateData.sheetUrl || "";
  const isPopup = stateData.mode === "popup" || true;

  const host = request.headers.get("host") || "localhost:3000";
  const protocol = host.includes("localhost") ? "http" : "https";
  const defaultBaseUrl = `${protocol}://${host}`;
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || process.env.NEXT_PUBLIC_SITE_URL || defaultBaseUrl;
  const redirectUri = `${baseUrl}/api/google-sheets-callback`;

  if (error) {
    const html = popupHtml({
      success: false,
      shopSlug,
      errorMsg: error === "access_denied" ? "Autorisation Google refusée." : error,
    });
    if (isPopup) return new NextResponse(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    return NextResponse.redirect(`${baseUrl}/boutiques/${shopSlug}/admin/settings?error=google_oauth_denied`);
  }

  if (!code) {
    const html = popupHtml({ success: false, shopSlug, errorMsg: "Code d'autorisation manquant." });
    if (isPopup) return new NextResponse(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    return NextResponse.redirect(`${baseUrl}/boutiques/${shopSlug}/admin/settings?error=no_code`);
  }

  if (!shopSlug) {
    const html = popupHtml({ success: false, shopSlug: "", errorMsg: "Identifiant boutique manquant." });
    if (isPopup) return new NextResponse(html, { headers: { "Content-Type": "text/html;charset=utf-8" } });
    return NextResponse.redirect(`${baseUrl}/login?error=no_shop_slug`);
  }

  try {
    const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
    const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;

    if (!GOOGLE_CLIENT_ID || !GOOGLE_CLIENT_SECRET) {
      throw new Error("Configuration Google OAuth incomplète sur le serveur.");
    }

    // Échange du code contre les tokens
    const tokenResponse = await fetch("https://oauth2.googleapis.com/token", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: new URLSearchParams({
        code,
        client_id: GOOGLE_CLIENT_ID,
        client_secret: GOOGLE_CLIENT_SECRET,
        redirect_uri: redirectUri,
        grant_type: "authorization_code",
      }),
    });

    const tokens = await tokenResponse.json();

    if (!tokens.access_token) {
      throw new Error(tokens.error_description || tokens.error || "Impossible d'obtenir les jetons Google.");
    }

    const defaultColumns = [
      "Date", "Nom du client", "Téléphone", "Adresse", "Quartier",
      "Produit", "Quantité", "Total", "Devise", "Statut", "Pays"
    ];

    const oauth2Client = new google.auth.OAuth2(
      GOOGLE_CLIENT_ID,
      GOOGLE_CLIENT_SECRET,
      redirectUri
    );
    oauth2Client.setCredentials(tokens);

    let finalSheetUrl = initialSheetUrl;
    let finalColumns = defaultColumns;
    let spreadsheetId = extractSheetId(initialSheetUrl);

    // Si aucune feuille n'était renseignée (connexion en 1 clic standard) : Créer une nouvelle feuille !
    if (!spreadsheetId) {
      const sheets = google.sheets({ version: "v4", auth: oauth2Client });
      const createResponse = await sheets.spreadsheets.create({
        requestBody: {
          properties: {
            title: `Commandes ShopEazy - ${shopSlug}`,
          },
          sheets: [
            {
              properties: {
                title: "Commandes",
                gridProperties: {
                  frozenRowCount: 1,
                },
              },
              data: [
                {
                  startRow: 0,
                  startColumn: 0,
                  rowData: [
                    {
                      values: defaultColumns.map((header) => ({
                        userEnteredValue: { stringValue: header },
                        userEnteredFormat: {
                          textFormat: {
                            bold: true,
                            foregroundColor: { red: 1, green: 1, blue: 1 },
                          },
                          backgroundColor: {
                            red: 0.063, // Emerald #10B981
                            green: 0.725,
                            blue: 0.506,
                          },
                          horizontalAlignment: "CENTER",
                        },
                      })),
                    },
                  ],
                },
              ],
            },
          ],
        },
      });

      spreadsheetId = createResponse.data.spreadsheetId || null;
      if (spreadsheetId) {
        finalSheetUrl = `https://docs.google.com/spreadsheets/d/${spreadsheetId}/edit`;
      }
    }

    // Partager la feuille avec le service account pour que les commandes en arrière-plan et le bot WhatsApp écrivent toujours sans faille
    const saEmail = getServiceAccountEmail() || "shopeazy-sheets@afro-circle-487702.iam.gserviceaccount.com";
    if (spreadsheetId) {
      try {
        const drive = google.drive({ version: "v3", auth: oauth2Client });
        await drive.permissions.create({
          fileId: spreadsheetId,
          requestBody: {
            role: "writer",
            type: "user",
            emailAddress: saEmail,
          },
          sendNotificationEmail: false,
        });
      } catch (driveErr: any) {
        console.warn("[google-sheets-callback] Drive permission sharing notice:", driveErr.message);
      }
    }

    // Enregistrer les données dans la table settings
    const supabase = createSupabaseServerClient(request);
    const updatePayload: Record<string, any> = {
      google_sheet_url: finalSheetUrl,
      google_sheet_columns: finalColumns,
      google_access_token: tokens.access_token,
      google_refresh_token: tokens.refresh_token || null,
      updated_at: new Date().toISOString(),
    };

    const { data: existingSettings } = await supabase
      .from("settings")
      .select("id")
      .eq("shop_slug", shopSlug)
      .maybeSingle();

    if (existingSettings?.id) {
      await supabase
        .from("settings")
        .update(updatePayload)
        .eq("id", existingSettings.id);
    } else {
      await supabase
        .from("settings")
        .insert([{ ...updatePayload, shop_slug: shopSlug }]);
    }

    if (isPopup) {
      return new NextResponse(
        popupHtml({
          success: true,
          shopSlug,
          sheetUrl: finalSheetUrl,
          columns: finalColumns,
        }),
        { headers: { "Content-Type": "text/html;charset=utf-8" } }
      );
    }

    return NextResponse.redirect(
      `${baseUrl}/boutiques/${shopSlug}/admin/settings?success=google_connected`
    );
  } catch (err: any) {
    console.error("OAuth callback error:", err);
    const html = popupHtml({
      success: false,
      shopSlug,
      errorMsg: err.message || "Erreur lors de la configuration.",
    });

    if (isPopup) {
      return new NextResponse(html, {
        headers: { "Content-Type": "text/html;charset=utf-8" },
      });
    }

    return NextResponse.redirect(
      `${baseUrl}/boutiques/${shopSlug}/admin/settings?error=${encodeURIComponent(err.message)}`
    );
  }
}
