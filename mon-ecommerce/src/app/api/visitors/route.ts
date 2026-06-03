import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { serviceSupabase } from "@/lib/supabase-admin";
import { extractSubdomain } from "@/lib/host";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, path, type } = body;

    const host = request.headers.get("host") || "";
    const shopSlug = extractSubdomain(host) || "default";

    const headers = request.headers;
    const ip = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown";
    const userAgent = headers.get("user-agent") || "";
    const referrer = headers.get("referer") || "";

    if (!session_id) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const { error } = await serviceSupabase.from("visitors").upsert({
      session_id,
      ip_address: ip,
      user_agent: userAgent,
      referrer,
      path: path || "/",
      is_online: true,
      last_seen: new Date().toISOString(),
      shop_slug: shopSlug,
    }, { onConflict: "session_id", ignoreDuplicates: false });

    if (error) {
      console.error("Visitor tracking error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "online";
    const start = searchParams.get("start");
    const end = searchParams.get("end");

    const host = request.headers.get("host") || "";
    const shopSlug = extractSubdomain(host) || searchParams.get("shop_slug");

    if (type === "online") {
      const cutoff = new Date(Date.now() - 30 * 60 * 1000).toISOString();
      let query = supabase
        .from("visitors")
        .select("session_id")
        .eq("is_online", true)
        .gte("last_seen", cutoff);

      if (shopSlug) query = query.eq("shop_slug", shopSlug);

      const { data, error } = await query;

      if (error) throw error;
      const unique = new Set((data || []).map((r: any) => r.session_id));
      return NextResponse.json({ online: unique.size });
    }

    if (type === "visits") {
      const startDate = start || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const endDate = end || new Date().toISOString();

      let query = supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .gte("created_at", startDate)
        .lte("created_at", endDate);

      if (shopSlug) query = query.eq("shop_slug", shopSlug);

      const { count, error } = await query;

      if (error) throw error;
      return NextResponse.json({ visits: count || 0 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
