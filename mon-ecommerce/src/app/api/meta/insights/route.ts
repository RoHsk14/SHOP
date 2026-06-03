import { NextRequest, NextResponse } from "next/server";
import { createSupabaseServerClient } from "@/lib/supabase-server";

export async function GET(request: NextRequest) {
  try {
    const supabase = createSupabaseServerClient(request);
    const { data: { session } } = await supabase.auth.getSession();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Non authentifié" }, { status: 401 });
    }

    const searchParams = request.nextUrl.searchParams;
    const shopSlug = searchParams.get("shop_slug");

    if (!shopSlug) {
      return NextResponse.json({ error: "shop_slug requis" }, { status: 400 });
    }

    const { data: settings } = await supabase
      .from("settings")
      .select("meta_access_token, meta_business_account_id")
      .eq("shop_slug", shopSlug)
      .single();

    if (!settings?.meta_access_token || !settings?.meta_business_account_id) {
      return NextResponse.json({ error: "Meta access token or business account not configured" }, { status: 400 });
    }

    const days = searchParams.get("days") || "7";
    const since = searchParams.get("since");
    const until = searchParams.get("until");

    let sinceParam: string;
    let untilParam: string;
    if (since && until) {
      sinceParam = since;
      untilParam = until;
    } else {
      const d = parseInt(days);
      const end = new Date();
      const start = new Date();
      start.setDate(start.getDate() - d);
      sinceParam = Math.floor(start.getTime() / 1000).toString();
      untilParam = Math.floor(end.getTime() / 1000).toString();
    }

    const fields = [
      "impressions",
      "reach",
      "clicks",
      "ctr",
      "spend",
      "actions",
      "date_start",
      "date_stop",
    ].join(",");

    const res = await fetch(
      `https://graph.facebook.com/v19.0/${settings.meta_business_account_id}/insights?` +
      new URLSearchParams({
        access_token: settings.meta_access_token,
        fields,
        time_range: JSON.stringify({ since: sinceParam, until: untilParam }),
        time_increment: "1",
        level: "account",
      })
    );

    const result = await res.json();

    if (!res.ok) {
      return NextResponse.json({ error: result.error?.message || "Meta API error" }, { status: 400 });
    }

    const insights = (result.data || []).map((d: any) => {
      const purchaseAction = (d.actions || []).find((a: any) => a.action_type === "purchase");
      const sales = parseInt(purchaseAction?.value || "0");
      const spend = parseFloat(d.spend || "0");

      return {
        date: d.date_start,
        impressions: parseInt(d.impressions || "0"),
        reach: parseInt(d.reach || "0"),
        clicks: parseInt(d.clicks || "0"),
        ctr: parseFloat(d.ctr || "0"),
        spend,
        sales,
        roas: spend > 0 ? (sales * 1) / spend : 0,
      };
    });

    return NextResponse.json({ success: true, insights });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
