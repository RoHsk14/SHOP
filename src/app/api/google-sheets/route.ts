import { NextRequest, NextResponse } from "next/server";
import { google } from "googleapis";
import fs from "fs";
import path from "path";

// Google Sheets API avec Service Account (fichier JSON)
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { sheet_url, columns, row_data } = body;
    
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
        error: "Fichier service-account-key.json manquant à la racine du projet" 
      }, { status: 500 });
    }
    
    const credentials = JSON.parse(fs.readFileSync(keyPath, "utf-8"));
    
    // Créer le client JWT
    const auth = new google.auth.JWT({
      email: credentials.client_email,
      key: credentials.private_key,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"],
    });
    
    // Créer le client Sheets
    const sheets = google.sheets({ version: "v4", auth });
    
    // Récupérer le nom de la première feuille
    const sheetInfo = await sheets.spreadsheets.get({
      spreadsheetId: sheetId,
      fields: "sheets.properties"
    });
    
    const sheetName = sheetInfo.data.sheets?.[0]?.properties?.title || "Sheet1";
    
    // Préparer les données
    const values: any[] = [];
    if (columns && Array.isArray(columns)) {
      values.push(columns.map((col: string) => row_data?.[col] ?? ""));
    } else {
      // Colonnes par défaut
      values.push([
        row_data?.Date || new Date().toLocaleString("fr-FR"),
        row_data?.Nom_du_client || "",
        row_data?.Téléphone || "",
        row_data?.Adresse || "",
        row_data?.Quartier || "",
        row_data?.Produit || "",
        row_data?.Quantité || 1,
        row_data?.Total || 0,
        row_data?.Devise || "EUR",
        row_data?.Statut || "pending"
      ]);
    }
    
    // Vérifier si les en-têtes existent déjà
    const headerResponse = await sheets.spreadsheets.values.get({
      spreadsheetId: sheetId,
      range: sheetName,
      majorDimension: "ROWS"
    });
    
    const rows = headerResponse.data.values || [];
    
    // Si le Sheet est vide, ajouter les en-têtes automatiquement
    if (rows.length === 0) {
      const headers = columns && Array.isArray(columns) ? columns : [
        "Date", "Nom du client", "Téléphone", "Adresse", "Quartier", "Produit", "Quantité", "Total", "Devise", "Statut"
      ];
      
      await sheets.spreadsheets.values.update({
        spreadsheetId: sheetId,
        range: sheetName + "!A1",
        valueInputOption: "RAW",
        requestBody: {
          values: [headers]
        }
      });
    }
    
    // Envoyer les données à Google Sheets (append automatique à la fin)
    const response = await sheets.spreadsheets.values.append({
      spreadsheetId: sheetId,
      range: sheetName,
      valueInputOption: "RAW",
      requestBody: {
        values: values,
      },
    });
    
    if (response.status === 200) {
      return NextResponse.json({ success: true });
    } else {
      console.error("Google Sheets error:", response.data);
      return NextResponse.json({ error: "Échec de l'envoi vers le Sheet" }, { status: 500 });
    }
    
  } catch (error: any) {
    console.error("Google Sheets integration error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
