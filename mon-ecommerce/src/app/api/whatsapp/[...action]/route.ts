import { NextRequest, NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/supabase-admin";
import { getNhostAuthUrl } from "@/lib/nhost";

const VALID_ACTIONS = new Set([
  "status",
  "qr-image",
  "groups",
  "pairing",
  "reset",
  "connect",
  "disconnect",
  "config",
  "health",
]);

async function resolveUser(accessToken: string) {
  try {
    const res = await fetch(`${getNhostAuthUrl()}/user`, {
      headers: { Authorization: `Bearer ${accessToken}` },
      cache: "no-store",
    });
    if (!res.ok) return null;
    const user = await res.json();
    return user?.id ? user : null;
  } catch {
    return null;
  }
}

async function assertShopOwner(userId: string, shopSlug: string) {
  const { data: settings } = await serviceSupabase
    .from("settings")
    .select("user_id")
    .eq("shop_slug", shopSlug)
    .maybeSingle();

  if (!settings) return { ok: false as const, status: 404, error: "Boutique introuvable" };
  if (settings.user_id === userId) return { ok: true as const };

  const { data: adminRow } = await serviceSupabase
    .from("settings")
    .select("id")
    .eq("user_id", userId)
    .eq("is_super_admin", true)
    .limit(1)
    .maybeSingle();

  if (adminRow) return { ok: true as const };
  return { ok: false as const, status: 403, error: "Acces refuse a cette boutique" };
}

function parsePath(pathname: string): { shopSlug: string | null; action: string | null; isHealth: boolean } {
  const raw = pathname.replace(/^\/api\/whatsapp\/?/, "");
  const parts = raw.split("/").filter(Boolean);

  if (parts.length === 1 && parts[0] === "health") {
    return { shopSlug: null, action: "health", isHealth: true };
  }
  if (parts.length >= 2) {
    return { shopSlug: parts[0], action: parts[1], isHealth: false };
  }
  if (parts.length === 1 && VALID_ACTIONS.has(parts[0])) {
    return { shopSlug: null, action: parts[0], isHealth: false };
  }
  return { shopSlug: parts[0] || null, action: parts[1] || null, isHealth: false };
}

async function proxy(request: NextRequest) {
  const botBase = process.env.WHATSAPP_BOT_URL;
  if (!botBase) {
    return new NextResponse("WHATSAPP_BOT_URL not configured", { status: 500 });
  }

  const url = new URL(request.url);
  const { shopSlug, action, isHealth } = parsePath(url.pathname);

  if (isHealth) {
    const botRes = await fetch(`${botBase.replace(/\/$/, "")}/health`, { cache: "no-store" });
    return new NextResponse(botRes.body, {
      status: botRes.status,
      headers: { "Content-Type": botRes.headers.get("Content-Type") || "application/json" },
    });
  }

  if (!shopSlug || !action || !VALID_ACTIONS.has(action)) {
    return NextResponse.json(
      {
        error:
          "Chemin invalide. Utilisez /api/whatsapp/{shopSlug}/status|qr-image|groups|reset|pairing|connect|disconnect",
      },
      { status: 400 }
    );
  }

  if (!/^[a-z0-9][a-z0-9_-]{0,62}$/i.test(shopSlug)) {
    return NextResponse.json({ error: "shop_slug invalide" }, { status: 400 });
  }

  const authHeader = request.headers.get("authorization") || "";
  const token = authHeader.startsWith("Bearer ") ? authHeader.slice(7).trim() : "";
  if (!token) {
    return NextResponse.json({ error: "Non authentifie" }, { status: 401 });
  }

  const user = await resolveUser(token);
  if (!user) {
    return NextResponse.json(
      { error: "Session expiree — reconnectez-vous" },
      { status: 401 }
    );
  }

  const ownership = await assertShopOwner(user.id, shopSlug);
  if (!ownership.ok) {
    return NextResponse.json({ error: ownership.error }, { status: ownership.status });
  }

  if (action === "config") {
    return NextResponse.json({ success: true, message: "Config stockee cote boutique (settings)" });
  }

  const proxyUrl = `${botBase.replace(/\/$/, "")}/${shopSlug}/${action}${url.search}`;
  const headers = new Headers();
  headers.set("Authorization", `Bearer ${token}`);
  headers.set("Content-Type", request.headers.get("content-type") || "application/json");
  const botSecret = process.env.WHATSAPP_BOT_SECRET || process.env.BOT_INTERNAL_SECRET;
  if (botSecret) headers.set("X-Bot-Secret", botSecret);

  const init: RequestInit = {
    method: request.method,
    headers,
    redirect: "manual",
    cache: "no-store",
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
