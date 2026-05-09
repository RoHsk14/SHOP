import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuth, extractSheetId } from "@/lib/google-sheets";

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
        error: "Credentials Google manquants. Configurez GOOGLE_SERVICE_ACCOUNT_KEY dans Vercel."
      }, { status: 500 });
    }

    const sheets = google.sheets({ version: "v4", auth });

    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties",
    });

    const sheetName = sheetInfo.data.sheets?.[0]?.properties?.title || "Sheet1";

    const sanitize = (val: any) =>
      typeof val === "string" && val.startsWith("=") ? "'" + val : val;

    const values: any[] = [];
    if (columns && Array.isArray(columns)) {
      values.push(columns.map((col: string) => sanitize(row_data?.[col] ?? "")));
    } else {
      values.push([
        sanitize(row_data?.Date || new Date().toLocaleString("fr-FR")),
        sanitize(row_data?.Nom_du_client || ""),
        sanitize(row_data?.Téléphone || ""),
        sanitize(row_data?.Adresse || ""),
        sanitize(row_data?.Quartier || ""),
        sanitize(row_data?.Produit || ""),
        sanitize(row_data?.Quantité || 1),
        sanitize(row_data?.Total || 0),
        sanitize(row_data?.Devise || "EUR"),
        sanitize(row_data?.Statut || "pending"),
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
        "Produit", "Quantité", "Total", "Devise", "Statut",
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
