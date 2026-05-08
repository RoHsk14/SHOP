import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

// API pour récupérer les en-têtes (colonnes) d'un Google Sheet
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheet_url } = body;
    
    if (!sheet_url) {
      return NextResponse.json({ error: "sheet_url required" }, { status: 400 });
    }
    
    // Extraire l'ID du Sheet
    const match = sheet_url.match(/\/d\/([a-zA-Z0-9-_]+)/);
    if (!match) {
      return NextResponse.json({ error: "URL Google Sheet invalide" }, { status: 400 });
    }
    const sheetId = match[1];
    
    // Lire le fichier du compte de service
    const keyPath = path.join(process.cwd(), "service-account-key.json");
    if (!fs.existsSync(keyPath)) {
      return NextResponse.json({ 
        error: "Fichier service-account-key.json manquant" 
      }, { status: 500 });
    }
    
    const credentials = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    
    // Créer le client auth
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    
    const sheets = google.sheets({ version: "v4", auth });
    
    // Récupérer les en-têtes (première ligne)
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: "Sheet1!1:1", // Première ligne uniquement
    });
    
    const columns = response.data.values?.[0] || [];
    
    return NextResponse.json({ columns });
    
  } catch (error: any) {
    console.error("Error fetching columns:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
