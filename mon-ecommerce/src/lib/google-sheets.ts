import { google } from "googleapis";

export function getAuth() {
  let credentials: any = null;

  const envKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
  if (envKey) {
    credentials = JSON.parse(envKey);
  } else {
    try {
      const fs = require("fs");
      const path = require("path");
      const filePath = path.join(process.cwd(), "service-account-key.json");
      credentials = JSON.parse(fs.readFileSync(filePath, "utf-8"));
    } catch {
      return null;
    }
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
    // Priority 1: read from env var (required on Vercel / production)
    const envKey = process.env.GOOGLE_SERVICE_ACCOUNT_KEY;
    if (envKey) {
      const credentials = JSON.parse(envKey);
      return credentials.client_email || null;
    }

    // Priority 2: local file fallback (development only)
    const credentials = JSON.parse(
      require("fs").readFileSync(
        require("path").join(process.cwd(), "service-account-key.json"),
        "utf-8"
      )
    );
    return credentials.client_email || null;
  } catch {
    return null;
  }
}
