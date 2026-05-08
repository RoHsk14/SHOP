import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Initialiser les colonnes du Google Sheet avec le compte de service
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheet_url, columns } = body;
    
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
    
    // Utiliser les colonnes fournies ou celles par défaut
    const headers = columns && Array.isArray(columns) ? columns : [
      "Date", "Nom du client", "Téléphone", "Adresse", "Quartier", 
      "Produit", "Quantité", "Total", "Devise", "Statut"
    ];
    
    // Récupérer le nom de la première feuille
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties"
    });
    
    const sheetName = sheetInfo.data.sheets?.[0]?.properties?.title || "Sheet1";
    
    // Écrire les en-têtes dans la première ligne
    await sheets.spreadsheets.values.update({
      spreadsheetId: sheetId,
      range: `${sheetName}!A1`,
      valueInputOption: "RAW",
      requestBody: {
        values: [headers]
      }
    });
    
    return NextResponse.json({ success: true, columns: headers });
    
  } catch (error: any) {
    console.error("Init error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
