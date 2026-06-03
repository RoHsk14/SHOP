import { NextResponse } from "next/server";
import { getServiceAccountEmail } from "@/lib/google-sheets";

export async function GET() {
  const email = getServiceAccountEmail();
  if (!email) {
    return NextResponse.json({ error: "Service account not configured" }, { status: 500 });
  }
  return NextResponse.json({ email });
}
