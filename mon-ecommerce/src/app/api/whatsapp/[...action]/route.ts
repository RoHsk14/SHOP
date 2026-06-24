import { NextRequest, NextResponse } from "next/server";

async function proxy(request: NextRequest) {
  const botBase = process.env.WHATSAPP_BOT_URL;
  if (!botBase) {
    return new NextResponse("WHATSAPP_BOT_URL not configured", { status: 500 });
  }

  const url = new URL(request.url);
  const action = url.pathname.replace(/^\/api\/whatsapp\//, "");
  const apiActions = new Set(["groups", "pairing", "config", "webhook", "reset"]);
  const path = apiActions.has(action) ? `/api/${action}` : `/${action}`;
  const proxyUrl = `${botBase}${path}${url.search}`;

  const headers = new Headers(request.headers);
  headers.delete("host");
  headers.delete("accept-encoding");
  headers.delete("content-length");
  headers.delete("content-encoding");
  headers.delete("transfer-encoding");
  headers.delete("connection");

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
  };

  if (request.method !== "GET" && request.method !== "HEAD") {
    init.body = request.clone().body;
    (init as any).duplex = "half";
  }

  const botRes = await fetch(proxyUrl, init);

  const resHeaders = new Headers();
  const skipHeaders = new Set([
    "content-encoding",
    "content-length",
    "transfer-encoding",
    "connection",
    "keep-alive",
  ]);
  botRes.headers.forEach((value, key) => {
    if (!skipHeaders.has(key.toLowerCase())) {
      resHeaders.set(key, value);
    }
  });

  return new NextResponse(botRes.body, {
    status: botRes.status,
    statusText: botRes.statusText,
    headers: resHeaders,
  });
}

export { proxy as GET, proxy as POST, proxy as PUT, proxy as DELETE, proxy as PATCH };
