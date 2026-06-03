import { NextResponse } from "next/server";

const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export async function POST(req: Request) {
  try {
    const { createClient } = await import("@supabase/supabase-js");
    const supabase = createClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { customer_name, total_price, currency, shop_slug } = await req.json();

    let devicesQuery = supabase.from("admin_devices").select("push_token");
    if (shop_slug) devicesQuery = devicesQuery.eq("shop_slug", shop_slug);

    const { data: devices } = await devicesQuery;

    if (!devices || devices.length === 0) {
      return NextResponse.json({ sent: 0 });
    }

    const messages = devices.map((d: { push_token: string }) => ({
      to: d.push_token,
      sound: "default",
      title: "🛍️ Nouvelle commande !",
      body: `${customer_name} · ${total_price} ${currency || "EUR"}`,
      data: { screen: "orders" },
    }));

    const res = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(messages),
    });

    const result = await res.json();
    return NextResponse.json({ sent: messages.length, result });
  } catch (error) {
    console.error("Push notification error:", error);
    return NextResponse.json({ error: "Failed to send" }, { status: 500 });
  }
}
