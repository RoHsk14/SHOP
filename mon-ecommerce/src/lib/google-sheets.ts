import { google } from "googleapis";
import fs from "fs";
import path from "path";

function loadServiceAccountCredentials(): {
  client_email?: string;
  private_key?: string;
  [key: string]: unknown;
} | null {
  // 1) JSON complet en variable d'env (prod / Vercel)
  const envKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (envKey) {
    try {
      return JSON.parse(envKey);
    } catch {
      console.error("[google-sheets] GOOGLE_SERVICE_ACCOUNT_KEY JSON invalide");
      return null;
    }
  }

  // 2) Chemin fichier via env
  const envPath = process.env.GOOGLE_SERVICE_ACCOUNT_KEY_PATH;
  const candidates = [
    envPath,
    envPath ? path.resolve(process.cwd(), envPath) : null,
    envPath ? path.resolve(envPath) : null,
    path.join(process.cwd(), "service-account-key.json"),
    path.join(process.cwd(), "services/whatsapp-bot/service-account-key.json"),
  ].filter(Boolean) as string[];

  for (const filePath of candidates) {
    try {
      if (fs.existsSync(filePath)) {
        return JSON.parse(fs.readFileSync(filePath, "utf-8"));
      }
    } catch (e: any) {
      console.error("[google-sheets] lecture", filePath, e.message);
    }
  }

  return null;
}

export function getAuth() {
  const credentials = loadServiceAccountCredentials();
  if (!credentials?.client_email || !credentials?.private_key) {
    return null;
  }

  return new google.auth.JWT({
    email: credentials.client_email,
    key: credentials.private_key,
    scopes: ["https://www.googleapis.com/auth/spreadsheets"],
  });
}

export function extractSheetId(sheet_url: string): string | null {
  const match = sheet_url.match(/\/d\/([a-zA-Z0-9-_]+)/);
  if (!match) return null;
  const id = match[1];
  if (!/^[a-zA-Z0-9_-]{30,}$/.test(id)) return null;
  return id;
}

export function getServiceAccountEmail(): string | null {
  try {
    const credentials = loadServiceAccountCredentials();
    return credentials?.client_email || null;
  } catch {
    return null;
  }
}
