import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
  try {
    const { data: settings } = await supabase
      .from("settings")
      .select("meta_access_token, meta_business_account_id, meta_catalog_id")
      .single();

    if (!settings?.meta_access_token || !settings?.meta_business_account_id) {
      return NextResponse.json({ error: "Meta access token or business account not configured" }, { status: 400 });
    }

    const { catalog_id } = await request.json();
    const access_token = settings.meta_access_token;
    const business_id = settings.meta_business_account_id;

    let activeCatalogId = catalog_id || settings.meta_catalog_id;

    // 1. If no catalog exists, create one
    if (!activeCatalogId) {
      const createRes = await fetch(
        `https://graph.facebook.com/v19.0/${business_id}/product_catalogs`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            name: "Mon E-commerce Catalog",
            access_token,
          }),
        }
      );
      const createData = await createRes.json();

      if (!createRes.ok) {
        return NextResponse.json(
          { error: createData.error?.message || "Failed to create catalog" },
          { status: 400 }
        );
      }
      activeCatalogId = createData.id;
    }

    // 2. Fetch products from Supabase
    const { data: products, error: dbError } = await supabase
      .from("products")
      .select("*");

    if (dbError) {
      return NextResponse.json({ error: "Database error" }, { status: 500 });
    }

    // 3. Sync products to Facebook catalog
    const results: { product_name: string; status: "success" | "error"; message: string }[] = [];

    for (const product of products) {
      try {
        const prices = product.prices || {};
        const currency = Object.keys(prices)[0] || "EUR";
        const price = Object.values(prices)[0] || 0;
        const imageUrl = product.images?.[0] || "";

        const body: Record<string, any> = {
          title: product.name,
          description: product.description || "",
          price: { currency, value: parseFloat(String(price)) },
          url: process.env.NEXT_PUBLIC_SITE_URL
            ? `${process.env.NEXT_PUBLIC_SITE_URL}/?product=${product.id}`
            : `https://lwivyouaiizweukrnrtz.supabase.co`,
          image_url: imageUrl,
          access_token,
        };

        if (product.sku) body.sku = product.sku;
        if (product.barcode) body.gtin = product.barcode;

        // Check if product already exists in catalog
        const searchRes = await fetch(
          `https://graph.facebook.com/v19.0/${activeCatalogId}/products?filtering=${encodeURIComponent(JSON.stringify([{ field: "name", operator: "CONTAIN", value: product.name }]))}&access_token=${access_token}`
        );
        const searchData = await searchRes.json();

        if (searchData.data && searchData.data.length > 0) {
          // Update existing product
          const fbProductId = searchData.data[0].id;
          const updateRes = await fetch(
            `https://graph.facebook.com/v19.0/${fbProductId}`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );
          if (updateRes.ok) {
            results.push({ product_name: product.name, status: "success", message: "Mis à jour" });
          } else {
            const err = await updateRes.json();
            results.push({ product_name: product.name, status: "error", message: err.error?.message || "Update failed" });
          }
        } else {
          // Create new product
          const createProductRes = await fetch(
            `https://graph.facebook.com/v19.0/${activeCatalogId}/products`,
            {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(body),
            }
          );
          if (createProductRes.ok) {
            results.push({ product_name: product.name, status: "success", message: "Créé" });
          } else {
            const err = await createProductRes.json();
            results.push({ product_name: product.name, status: "error", message: err.error?.message || "Create failed" });
          }
        }
      } catch (err: any) {
        results.push({ product_name: product.name, status: "error", message: err.message });
      }
    }

    return NextResponse.json({
      success: true,
      catalog_id: activeCatalogId,
      synced: products.length,
      results,
    });
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
