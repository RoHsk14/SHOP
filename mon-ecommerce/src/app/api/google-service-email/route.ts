import { NextResponse } from "next/server";
import { getServiceAccountEmail } from "@/lib/google-sheets";

export async function GET() {
  const email = getServiceAccountEmail();
  if (!email) {
    return NextResponse.json(
      {
        error: "Service account non configure",
        hint:
          "Placez service-account-key.json a la racine de mon-ecommerce, ou definissez GOOGLE_SERVICE_ACCOUNT_KEY (JSON) / GOOGLE_SERVICE_ACCOUNT_KEY_PATH",
      },
      { status: 500 }
    );
  }
  return NextResponse.json({ email });
}
