import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST - Record visitor heartbeat
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id, path } = body;
    
    const headers = request.headers;
    const ip = headers.get("x-forwarded-for") || headers.get("x-real-ip") || "unknown";
    const userAgent = headers.get("user-agent") || "";
    const referrer = headers.get("referer") || "";

    if (!session_id) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("visitors")
      .upsert({
        session_id,
        ip_address: ip,
        user_agent: userAgent,
        referrer,
        path: path || "/",
        is_online: true,
        last_seen: new Date().toISOString(),
      }, {
        onConflict: "session_id"
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

// GET - Get visitor stats
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const type = searchParams.get("type") || "online";

    if (type === "online") {
      const { count, error } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .eq("is_online", true)
        .gte("last_seen", new Date(Date.now() - 30 * 60 * 1000).toISOString());

      if (error) throw error;
      return NextResponse.json({ online: count || 0 });
    }

    if (type === "today") {
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      
      const { count, error } = await supabase
        .from("visitors")
        .select("*", { count: "exact", head: true })
        .gte("created_at", today.toISOString());

      if (error) throw error;
      return NextResponse.json({ visits: count || 0 });
    }

    return NextResponse.json({ error: "Invalid type" }, { status: 400 });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
