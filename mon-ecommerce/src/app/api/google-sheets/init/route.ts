import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuth, extractSheetId } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheet_url, columns } = body;

    if (!sheet_url) {
      return NextResponse.json({ error: "sheet_url required" }, { status: 400 });
    }

    const sheetId = extractSheetId(sheet_url);
    if (!sheetId) {
      return NextResponse.json({ error: "URL Google Sheet invalide" }, { status: 400 });
    }

    const auth = getAuth();
    if (!auth) {
      return NextResponse.json({ error: "Credentials Google manquants" }, { status: 500 });
    }

    const sheets = google.sheets({ version: "v4", auth });

    const sanitize = (val: any) =>
      typeof val === "string" && val.startsWith("=") ? "'" + val : val;

    const headers = columns && Array.isArray(columns) ? columns.map(sanitize) : [
      "Date", "Nom du client", "Téléphone", "Adresse", "Quartier",
      "Produit", "Quantité", "Total", "Devise", "Statut",
    ];

    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties",
    });

    const sheetName = sheetInfo.data.sheets?.[0]?.properties?.title || "Sheet1";

    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: sheetName + "!A1",
      valueInputOption: "RAW",
      requestBody: { values: [headers] },
    });

    return NextResponse.json({ success: true, columns: headers });
  } catch (error: any) {
    console.error("Google Sheets init error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
