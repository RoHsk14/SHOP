import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import { getAuth, extractSheetId } from "@/lib/google-sheets";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheet_url } = body;

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

    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties",
    });

    const sheetName = sheetInfo.data.sheets?.[0]?.properties?.title || "Sheet1";

    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetName,
      majorDimension: "ROWS",
    });

    const columns = response.data.values?.[0] || [];

    return NextResponse.json({ columns });
  } catch (error: any) {
    console.error("Google Sheets columns error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
