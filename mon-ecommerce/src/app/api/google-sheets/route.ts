import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuth, extractSheetId } from "@/lib/google-sheets";

async function getCountryFromIp(ip: string): Promise<string> {
  if (
    !ip ||
    ip === "127.0.0.1" ||
    ip === "localhost" ||
    ip === "::1" ||
    ip === "unknown" ||
    ip.startsWith("192.168.") ||
    ip.startsWith("10.") ||
    ip.startsWith("172.")
  ) {
    return "Localhost";
  }

  // 1. Try freeipapi.com (HTTPS, free, fast)
  try {
    const res = await fetch(`https://freeipapi.com/api/json/${ip}`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.countryName && data.countryName !== "-") {
        return data.countryName;
      }
    }
  } catch (e) {
    console.error("Error fetching country from freeipapi:", e);
  }

  // 2. Try ipapi.co (fallback)
  try {
    const res = await fetch(`https://ipapi.co/${ip}/json/`);
    if (res.ok) {
      const data = await res.json();
      if (data && data.country_name) {
        return data.country_name;
      }
    }
  } catch (e) {
    console.error("Error fetching country from ipapi:", e);
  }

  return "Inconnu";
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheet_url, columns, row_data } = body;

    if (!sheet_url) {
      return NextResponse.json({ error: "sheet_url required" }, { status: 400 });
    }

    const sheetId = extractSheetId(sheet_url);
    if (!sheetId) {
      return NextResponse.json({ error: "URL Google Sheet invalide" }, { status: 400 });
    }

    const auth = getAuth();
    if (!auth) {
      return NextResponse.json({
        error: "Credentials Google manquants. Configurez le service account."
      }, { status: 500 });
    }

    // Resolve country from client's IP address
    const rawIp = request.headers.get("x-forwarded-for") || request.headers.get("x-real-ip") || "127.0.0.1";
    const ip = rawIp.split(",")[0].trim().replace(/^::ffff:/, "");
    const countryName = await getCountryFromIp(ip);

    const sheets = google.sheets({ version: "v4", auth });

    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties",
    });

    const sheetName = sheetInfo.data.sheets?.[0]?.properties?.title || "Sheet1";

    const sanitize = (val: any) =>
      typeof val === "string" && val.startsWith("=") ? "'" + val : val;

    let finalRowData = { ...row_data };
    const values: any[] = [];

    if (columns && Array.isArray(columns)) {
      // If a country column exists, populate it on the server side
      const countryCol = columns.find((col: string) => {
        const lower = col.toLowerCase();
        return lower.includes("pays") || lower.includes("country");
      });
      if (countryCol) {
        finalRowData[countryCol] = countryName;
      }
      values.push(columns.map((col: string) => sanitize(finalRowData?.[col] ?? "")));
    } else {
      values.push([
        sanitize(finalRowData?.Date || new Date().toLocaleString("fr-FR")),
        sanitize(finalRowData?.Nom_du_client || ""),
        sanitize(finalRowData?.Téléphone || ""),
        sanitize(finalRowData?.Adresse || ""),
        sanitize(finalRowData?.Quartier || ""),
        sanitize(finalRowData?.Produit || ""),
        sanitize(finalRowData?.Quantité || 1),
        sanitize(finalRowData?.Total || 0),
        sanitize(finalRowData?.Devise || "EUR"),
        sanitize(finalRowData?.Statut || "À traiter"),
        sanitize(countryName),
      ]);
    }

    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetName,
      majorDimension: "ROWS",
    });

    const rows = headerResponse.data.values || [];

    if (rows.length === 0) {
      const headers = columns && Array.isArray(columns) ? columns : [
        "Date", "Nom du client", "Téléphone", "Adresse", "Quartier",
        "Produit", "Quantité", "Total", "Devise", "Statut", "Pays",
      ];

      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: sheetName + "!A1",
        valueInputOption: "RAW",
        requestBody: { values: [headers] },
      });
    }

    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: sheetName,
      valueInputOption: "RAW",
      requestBody: { values },
    });

    if (response.status === 200) {
      return NextResponse.json({ success: true });
    } else {
      return NextResponse.json({ error: "Échec de l'envoi vers le Sheet" }, { status: 500 });
    }
  } catch (error: any) {
    console.error("Google Sheets integration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
