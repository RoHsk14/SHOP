import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, quantity, total_price, currency, customer_name, customer_phone, customer_address } = body;

    if (!product_id || !quantity || !customer_name || !customer_phone) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from("products")
      .select("prices")
      .eq("id", product_id)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    const prices = product.prices || {};
    const productCurrency = Object.keys(prices)[0];
    const unitPrice = Object.values(prices)[0] as number;
    const realTotal = unitPrice * quantity;

    if (Math.abs(realTotal - total_price) > 0.01) {
      return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
    }

    const orderData = {
      product_id,
      quantity,
      total_price: realTotal,
      currency: productCurrency,
      customer_name,
      customer_phone,
      customer_address: customer_address || "",
    };

    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (insertError) throw insertError;

    // Send push notification to admin devices (non-bloquant)
    fetch(`${process.env.NEXT_PUBLIC_SITE_URL || "http://localhost:3000"}/api/notify-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name,
        total_price: realTotal,
        currency: productCurrency,
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
