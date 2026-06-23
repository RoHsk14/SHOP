import { NextRequest, NextResponse } from "next/server";

/**
 * Proxy the incoming request to the external WhatsApp bot service.
 */
async function proxy(request: NextRequest) {
  const botBase = process.env.WHATSAPP_BOT_URL;
  if (!botBase) {
    return new NextResponse("WHATSAPP_BOT_URL not configured", { status: 500 });
  }

  const url = new URL(request.url);
  const action = url.pathname.replace(/^\/api\/whatsapp\//, "");
  const proxyUrl = `${botBase}/${action}${url.search}`;

  // Build request options – preserve method, headers, body (except for GET/HEAD)
  const headers = new Headers(request.headers);
  headers.delete("host");
  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  // Attach body for non‑GET/HEAD requests
  if (request.method !== "GET" && request.method !== "HEAD") {
    const bodyText = await request.text();
    init.body = bodyText;
    if (!headers.has("content-type")) {
      headers.set("content-type", "application/json");
    }
  }

  const botRes = await fetch(proxyUrl, init);
  const resHeaders = new Headers();
  botRes.headers.forEach((value, key) => {
    if (key.toLowerCase() === "transfer-encoding") return;
    resHeaders.set(key, value);
  });

  return new NextResponse(botRes.body, {
    status: botRes.status,
    statusText: botRes.statusText,
    headers: resHeaders,
  });
}

// Export as handler for all HTTP methods
export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE, proxy as PATCH };
