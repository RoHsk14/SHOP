import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { serviceSupabase } from "@/lib/supabase-admin";
import { extractSubdomain } from "@/lib/host";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, path } = body;

    // Ne pas comptabiliser les pages admin, de connexion ou internes
    if (
      path &&
      (path.includes("/admin") ||
        path.startsWith("/admin") ||
        path.startsWith("/login") ||
        path.startsWith("/signup") ||
        path.startsWith("/auth") ||
        path.startsWith("/api"))
    ) {
      return NextResponse.json({ success: true, ignored: true });
    }

    const host = request.headers.get("host") || "";
    let shopSlug = extractSubdomain(host);
    if (!shopSlug && path) {
      const match = path.match(/^\/boutiques\/([^\/]+)/);
      if (match) shopSlug = match[1];
    }
    if (!shopSlug) shopSlug = "default";

    if (!session_id) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const now = new Date().toISOString();

    // Mettre a jour la session existante pour eviter la duplication des battements de coeur (heartbeats)
    const { data: updated } = await serviceSupabase
      .from("visitors")
      .update({
        is_online: true,
        last_seen: now,
        path: path || "/",
      })
      .eq("session_id", session_id);

    // Si la session n'existe pas encore en base, l'inserer une seule fois
    if (!updated || updated.length === 0) {
      const { error: insertError } = await serviceSupabase.from("visitors").insert({
        session_id,
        is_online: true,
        last_seen: now,
        shop_slug: shopSlug,
        path: path || "/",
      });

      if (insertError) {
        console.error("Visitor tracking insert error:", insertError);
        return NextResponse.json({ error: insertError.message }, { status: 500 });
      }
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
      const cutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString();
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
        .select("session_id")
        .gte("last_seen", startDate)
        .lte("last_seen", endDate);

      if (shopSlug) query = query.eq("shop_slug", shopSlug);

      const { data, error } = await query;

      if (error) throw error;
      const unique = new Set((data || []).map((r: any) => r.session_id));
      return NextResponse.json({ visits: unique.size });
    }

    if (type === "bucketed") {
      const startDate = start || new Date(new Date().setHours(0, 0, 0, 0)).toISOString();
      const endDate = end || new Date().toISOString();
      const bucket = searchParams.get("bucket") || "hour";

      let query = supabase
        .from("visitors")
        .select("session_id, last_seen")
        .gte("last_seen", startDate)
        .lte("last_seen", endDate)
        .order("last_seen", { ascending: true });

      if (shopSlug) query = query.eq("shop_slug", shopSlug);

      const { data, error } = await query;
      if (error) throw error;

      const counts: Record<string, Set<string>> = {};
      for (const row of data || []) {
        const d = new Date(row.last_seen);
        let label: string;
        if (bucket === "hour") {
          label = `${d.getHours().toString().padStart(2, "0")} h`;
        } else {
          label = d.toLocaleDateString("fr-FR", { day: "numeric", month: "short" });
        }
        if (!counts[label]) counts[label] = new Set();
        counts[label].add(row.session_id);
      }

      const buckets = Object.entries(counts).map(([label, set]) => ({ label, count: set.size }));
      return NextResponse.json({ buckets });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
