import { NextRequest, NextResponse } from "next/server";
import { getNhostStorageUrl, getNhostAdminSecret } from "@/lib/nhost";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const url = `${getNhostStorageUrl()}/files/${id}`;

  const res = await fetch(url, {
    headers: {
      "x-hasura-admin-secret": getNhostAdminSecret(),
    },
  });

  if (!res.ok) {
    return new NextResponse("File not found", { status: 404 });
  }

  const blob = await res.blob();
  const headers = new Headers();
  headers.set("Content-Type", res.headers.get("Content-Type") || "application/octet-stream");
  headers.set("Cache-Control", "public, max-age=31536000, immutable");

  return new NextResponse(blob, { status: 200, headers });
}
