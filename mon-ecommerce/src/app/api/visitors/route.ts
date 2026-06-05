import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { serviceSupabase } from "@/lib/supabase-admin";
import { extractSubdomain } from "@/lib/host";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, path } = body;

    const host = request.headers.get("host") || "";
    const shopSlug = extractSubdomain(host) || "default";

    const headers = request.headers;
    const ip = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown";
    const userAgent = headers.get("user-agent") || "";
    const referrer = headers.get("referer") || "";

    if (!session_id) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    const { error } = await serviceSupabase.from("visitors").insert({
      session_id,
      ip_address: ip,
      user_agent: userAgent,
      referrer,
      path: path || "/",
      is_online: true,
      last_seen: now,
      shop_slug: shopSlug,
    });

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
        .gte("last_seen", startDate)
        .lte("last_seen", endDate);

      if (shopSlug) query = query.eq("shop_slug", shopSlug);

      const { count, error } = await query;

      if (error) throw error;
      return NextResponse.json({ visits: count || 0 });
    }

    if (type === "bucketed") {
      const startDate = start || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const endDate = end || new Date().toISOString();
      const bucket = searchParams.get("bucket") || "hour";

      let query = supabase
        .from("visitors")
        .select("last_seen")
        .gte("last_seen", startDate)
        .lte("last_seen", endDate)
        .order("last_seen", { ascending: true });

      if (shopSlug) query = query.eq("shop_slug", shopSlug);

      const { data, error } = await query;
      if (error) throw error;

      const counts: Record<string, number> = {};
      for (const row of data || []) {
        const d = new Date(row.last_seen);
        let label: string;
        if (bucket === "hour") {
          label = `${d.getHours().toString().padStart(2, "0")} h`;
        } else {
          label = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
        }
        counts[label] = (counts[label] || 0) + 1;
      }

      const buckets = Object.entries(counts).map(([label, count]) => ({ label, count }));
      return NextResponse.json({ buckets });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
