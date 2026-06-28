import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";
import { extractSubdomain } from "@/lib/host";

export async function POST(request: NextRequest) {
  try {
    const { event_name, event_data, shop_slug: bodySlug, event_id } = await request.json();

    if (!event_name) {
      return NextResponse.json({ error: "event_name required" }, { status: 400 });
    }

    const host = request.headers.get("host") || "";
    const shopSlug = bodySlug || extractSubdomain(host);

    if (!shopSlug) {
      return NextResponse.json({ error: "shop_slug requis" }, { status: 400 });
    }

    const supabase = createSupabaseServerClient(request);

    const { data: settings, error: settingsError } = await supabase
      .from("settings")
      .select("pixel_id, capi_token")
      .eq("shop_slug", shopSlug)
      .single();

    if (settingsError || !settings?.pixel_id || !settings?.capi_token) {
      return NextResponse.json({ error: "Pixel ID or CAPI token not configured" }, { status: 400 });
    }

    const ip = request.headers.get("x-forwarded-for")?.split(",")[0]?.trim()
      || request.headers.get("x-real-ip")
      || "0.0.0.0";

    const ua = request.headers.get("user-agent") || "";

    const event: Record<string, any> = {
      event_name,
      event_time: Math.floor(Date.now() / 1000),
      event_source_url: request.headers.get("referer") || "",
      user_data: {
        client_ip_address: ip,
        client_user_agent: ua,
      },
    };

    if (event_id) event.event_id = event_id;
    if (event_data) event.custom_data = event_data;

    const body = { data: [event], access_token: settings.capi_token };

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${settings.pixel_id}/events`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      }
    );

    const result = await res.json();

    if (!res.ok) {
      console.error("CAPI error:", result);
      return NextResponse.json({ error: result.error?.message || "CAPI failed" }, { status: 400 });
    }

    return NextResponse.json({ success: true, result });
  } catch (error: any) {
    console.error("CAPI error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
