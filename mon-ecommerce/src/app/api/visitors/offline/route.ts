import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

// POST - Mark visitor as offline
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { session_id } = body;

    if (!session_id) {
      return NextResponse.json({ error: "session_id required" }, { status: 400 });
    }

    const { error } = await supabase
      .from("visitors")
      .update({ 
        is_online: false,
        last_seen: new Date().toISOString()
      })
      .eq("session_id", session_id);

    if (error) {
      console.error("Visitor offline error:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
