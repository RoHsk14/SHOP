import { NextRequest, NextResponse } from "next/server";
import { supabase } from "@/lib/supabase";
import {
  parseShopifyOrStandardCsv,
  prepareProductsForDatabase,
  removeEmojis,
} from "@/lib/shopify-product-import";

export async function POST(request: NextRequest) {
  try {
    let csvText = "";
    let shopSlug = "";
    let cleanEmojis = false;

    const contentType = request.headers.get("content-type") || "";

    if (contentType.includes("multipart/form-data")) {
      const formData = await request.formData();
      const file = formData.get("file") as File | null;
      shopSlug = (formData.get("shopSlug") as string) || "";
      cleanEmojis = formData.get("cleanEmojis") === "true";

      if (!file) {
        return NextResponse.json({ error: "Fichier CSV requis" }, { status: 400 });
      }
      csvText = await file.text();
    } else {
      const body = await request.json().catch(() => ({}));
      csvText = body.csv || "";
      shopSlug = body.shopSlug || "";
      cleanEmojis = !!body.cleanEmojis;
    }

    if (!shopSlug) {
      return NextResponse.json({ error: "shopSlug requis" }, { status: 400 });
    }

    if (!csvText || !csvText.trim()) {
      return NextResponse.json({ error: "Contenu CSV vide ou invalide" }, { status: 400 });
    }

    // Analyse intermédiaire du CSV (Shopify, Afro-Spy ou standard)
    const analysis = parseShopifyOrStandardCsv(csvText);

    if (analysis.errors.length > 0) {
      return NextResponse.json(
        { error: analysis.errors.join(", "), analysis },
        { status: 400 }
      );
    }

    if (analysis.products.length === 0) {
      return NextResponse.json(
        { error: "Aucun produit exploitable trouvé dans le fichier", analysis },
        { status: 400 }
      );
    }

    // Récupérer les slugs existants pour cette boutique afin d'éviter les collisions
    const { data: existingProducts } = await supabase
      .from("products")
      .select("slug")
      .eq("shop_slug", shopSlug);

    const existingSlugs = (existingProducts || [])
      .map((p: any) => p.slug)
      .filter(Boolean);

    // Préparer les produits pour la base de données
    const productsToPrepare = analysis.products.map((p) => ({
      ...p,
      name: cleanEmojis ? removeEmojis(p.name) : p.name,
    }));

    const recordsToInsert = prepareProductsForDatabase(
      productsToPrepare,
      shopSlug,
      existingSlugs
    );

    // Insertion par lots (batch) dans la base de données
    const { data: inserted, error: insertError } = await supabase
      .from("products")
      .insert(recordsToInsert);

    if (insertError) {
      console.error("[CSV Import API] Erreur insertion base:", insertError);
      return NextResponse.json(
        {
          error: insertError.message || "Erreur lors de l'enregistrement des produits",
          analysis,
        },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      count: recordsToInsert.length,
      format: analysis.format,
      formatLabel: analysis.formatLabel,
      totalRowsProcessed: analysis.totalRows,
      products: inserted || recordsToInsert,
      warnings: analysis.warnings,
    });
  } catch (error: any) {
    console.error("[CSV Import API] Erreur critique:", error);
    return NextResponse.json(
      { error: error?.message || "Erreur interne lors de l'import CSV" },
      { status: 500 }
    );
  }
}
