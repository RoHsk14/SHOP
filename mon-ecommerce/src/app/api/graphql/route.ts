import { NextRequest, NextResponse } from "next/server";
import { getNhostGraphqlUrl } from "@/lib/nhost";

export const runtime = "nodejs";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const nhostUrl = getNhostGraphqlUrl();

    const headers: Record<string, string> = {
      "Content-Type": "application/json",
    };
    const adminSecret = request.headers.get("x-hasura-admin-secret");
    if (adminSecret) headers["x-hasura-admin-secret"] = adminSecret;

    const res = await fetch(nhostUrl, {
      method: "POST",
      headers,
      body: JSON.stringify(body),
    });

    const text = await res.text();
    try {
      const data = JSON.parse(text);
      return NextResponse.json(data, { status: res.status });
    } catch {
      console.error("GraphQL upstream non-JSON:", res.status, text.slice(0, 300));
      return NextResponse.json(
        {
          errors: [
            {
              message: `GraphQL upstream returned non-JSON (HTTP ${res.status})`,
            },
          ],
        },
        { status: 502 }
      );
    }
  } catch (error: any) {
    console.error("GraphQL proxy error:", error);
    return NextResponse.json(
      { errors: [{ message: error.message || "GraphQL proxy error" }] },
      { status: 500 }
    );
  }
}
