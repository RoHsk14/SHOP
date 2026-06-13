import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import { extractSubdomain } from "@/lib/host";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { product_id, quantity, total_price, currency, customer_name, customer_phone, customer_address, offer_id } = body;

    if (!product_id || !quantity || !customer_name || !customer_phone) {
      return NextResponse.json({ error: "Champs requis manquants" }, { status: 400 });
    }

    const host = request.headers.get("host") || "";
    const shopSlug = extractSubdomain(host);
    if (!shopSlug) {
      return NextResponse.json({ error: "Boutique non identifiée" }, { status: 400 });
    }

    const { data: product, error } = await supabase
      .from("products")
      .select("price")
      .eq("id", product_id)
      .eq("shop_slug", shopSlug)
      .single();

    if (error || !product) {
      return NextResponse.json({ error: "Produit introuvable" }, { status: 404 });
    }

    let unitPrice = product.price || 0;
    let finalQuantity = Number(quantity);

    if (offer_id) {
      const { data: offer } = await supabase
        .from("offers")
        .select("discount_type, discount_value, min_quantity")
        .eq("id", offer_id)
        .eq("shop_slug", shopSlug)
        .eq("status", "active")
        .single();

      if (offer) {
        if (offer.discount_type === "percentage") {
          unitPrice = unitPrice * (1 - offer.discount_value / 100);
        } else {
          const discountPerUnit = offer.discount_value / Math.max(offer.min_quantity, 1);
          unitPrice = Math.max(0, unitPrice - discountPerUnit);
        }
        finalQuantity = Math.max(Number(quantity), offer.min_quantity);
      }
    }

    const realTotal = Math.round(unitPrice * finalQuantity);

    if (Math.abs(realTotal - total_price) > 1) {
      return NextResponse.json({ error: "Prix invalide" }, { status: 400 });
    }

    const orderData = {
      product_id,
      quantity: finalQuantity,
      total_price: realTotal,
      currency: "XOF",
      customer_name,
      customer_phone,
      customer_address: customer_address || "",
      shop_slug: shopSlug,
    };

    const { data: order, error: insertError } = await supabase
      .from("orders")
      .insert([orderData])
      .select()
      .single();

    if (insertError) throw insertError;

    // Send push notification to admin devices (non-bloquant)
    const protocol = host.includes("localhost") ? "http" : "https";
    const baseUrl = `${protocol}://${host}`;
    fetch(`${baseUrl}/api/notify-order`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        customer_name,
        total_price: realTotal,
        currency: "XOF",
        shop_slug: shopSlug,
      }),
    }).catch(() => {});

    return NextResponse.json({ success: true, order });
  } catch (error: any) {
    console.error("Order creation error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
