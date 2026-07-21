import { NextRequest, NextResponse } from "next/server";
import { getNhostStorageUrl, getNhostAdminSecret } from "@/lib/nhost";

export async function POST(req: NextRequest) {
  try {
    const formData = await req.formData();
    const file = formData.get("file[]");

    if (!file) {
      return NextResponse.json({ error: { message: "No file provided" } }, { status: 400 });
    }

    const url = `${getNhostStorageUrl()}/files`;
    const body = new FormData();
    body.append("file[]", file);

    const res = await fetch(url, {
      method: "POST",
      headers: { "x-hasura-admin-secret": getNhostAdminSecret() },
      body,
    });

    if (!res.ok) {
      const errBody = await res.json().catch(() => ({}));
      return NextResponse.json(
        { error: { message: errBody?.error?.message || errBody?.message || `Upload failed (${res.status})` } },
        { status: res.status }
      );
    }

    const result = await res.json();
    return NextResponse.json(result);
  } catch (err: any) {
    return NextResponse.json({ error: { message: err.message || "Upload failed" } }, { status: 500 });
  }
}
