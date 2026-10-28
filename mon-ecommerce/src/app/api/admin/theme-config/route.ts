import { NextRequest, NextResponse } from "next/server";
import { serviceSupabase } from "@/lib/supabase-admin";
import { ThemeConfig, SavedTheme, getPublishedConfig } from "@/lib/theme-config";

export const runtime = "nodejs";

// GET /api/admin/theme-config?shopSlug=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const shopSlug = searchParams.get("shopSlug");

    if (!shopSlug) {
      return NextResponse.json({ error: "shopSlug requis" }, { status: 400 });
    }

    const { data, error } = await serviceSupabase
      .from("settings")
      .select("id, shop_name, shop_slug, theme_id, theme_config, updated_at")
      .eq("shop_slug", shopSlug)
      .maybeSingle();

    if (error) {
      console.error("[API theme-config GET] Erreur Supabase:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    if (!data) {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    const rawConfig = typeof data.theme_config === "string" ? JSON.parse(data.theme_config) : (data.theme_config || {});
    const published = getPublishedConfig(rawConfig);
    const savedThemes: SavedTheme[] = rawConfig.savedThemes || [];
    const themeName = rawConfig.themeName || `${data.shop_name || shopSlug} - Principal`;

    return NextResponse.json({
      success: true,
      settingsId: data.id,
      shopName: data.shop_name || shopSlug,
      themeId: data.theme_id || "classic",
      themeName,
      publishedConfig: published,
      savedThemes,
      rawThemeConfig: data.theme_config,
      updatedAt: data.updated_at,
    });
  } catch (error: any) {
    console.error("[API theme-config GET] Erreur critique:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne du serveur" },
      { status: 500 }
    );
  }
}

// POST /api/admin/theme-config
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const {
      shopSlug,
      themeConfig, // nouveau publishedConfig
      savedThemes, // nouvelle liste de SavedTheme[]
      themeName,
      themeId,
      publishThemeId, // si présent, publie ce thème depuis savedThemes
    } = body;

    if (!shopSlug) {
      return NextResponse.json({ error: "shopSlug requis" }, { status: 400 });
    }

    // 1. Récupérer les paramètres actuels de la boutique
    const { data: currentSettings, error: fetchErr } = await serviceSupabase
      .from("settings")
      .select("id, shop_name, theme_id, theme_config")
      .eq("shop_slug", shopSlug)
      .maybeSingle();

    if (fetchErr) {
      console.error("[API theme-config POST] Erreur récupération boutique:", fetchErr);
      return NextResponse.json({ error: fetchErr.message }, { status: 500 });
    }

    if (!currentSettings) {
      return NextResponse.json({ error: "Boutique introuvable" }, { status: 404 });
    }

    const existingConfig =
      typeof currentSettings.theme_config === "string"
        ? JSON.parse(currentSettings.theme_config)
        : currentSettings.theme_config || {};

    let newPublishedConfig: ThemeConfig = themeConfig || getPublishedConfig(existingConfig);
    let newSavedThemes: SavedTheme[] =
      savedThemes !== undefined ? savedThemes : (existingConfig.savedThemes || []);
    let newThemeName: string =
      themeName || existingConfig.themeName || `${currentSettings.shop_name || shopSlug} - Principal`;
    let newThemeId: string = themeId || currentSettings.theme_id || "classic";

    // 2. Traitement si publication atomique d'un thème brouillon
    if (publishThemeId) {
      const themeToPublish = newSavedThemes.find((t) => t.id === publishThemeId);
      if (!themeToPublish) {
        return NextResponse.json(
          { error: `Thème avec l'ID ${publishThemeId} introuvable dans la bibliothèque` },
          { status: 404 }
        );
      }

      // Archiver le thème actif actuel dans la bibliothèque
      const currentActiveName =
        existingConfig.themeName || `${currentSettings.shop_name || shopSlug} - Principal`;
      const archivedTheme: SavedTheme = {
        id: `theme_${Date.now()}_archived`,
        name: currentActiveName,
        config: getPublishedConfig(existingConfig),
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };

      // Mettre à jour le thème actif avec celui sélectionné
      newPublishedConfig = themeToPublish.config;
      newThemeName = themeToPublish.name;

      // Nouvelle liste de savedThemes (retire celui publié, ajoute l'ancien actif)
      newSavedThemes = [
        archivedTheme,
        ...newSavedThemes.filter((t) => t.id !== publishThemeId),
      ];
    }

    // 3. Préparer l'objet config final
    const finalThemeConfig: any = {
      ...newPublishedConfig,
      themeName: newThemeName,
      savedThemes: newSavedThemes,
    };

    // Préserver __draft si existant et si on ne vient pas de publier un nouveau thème
    if (existingConfig.__draft && !publishThemeId && !themeConfig) {
      finalThemeConfig.__draft = existingConfig.__draft;
    }

    const updatePayload: Record<string, any> = {
      theme_config: finalThemeConfig,
      updated_at: new Date().toISOString(),
    };

    if (newThemeId) {
      updatePayload.theme_id = newThemeId;
    }

    // 4. Mettre à jour via serviceSupabase avec l'admin secret Hasura
    const { data: updateRes, error: updateErr } = await serviceSupabase
      .from("settings")
      .update(updatePayload)
      .eq("shop_slug", shopSlug);

    if (updateErr) {
      console.error("[API theme-config POST] Erreur mise à jour settings:", updateErr);
      return NextResponse.json({ error: updateErr.message }, { status: 500 });
    }

    return NextResponse.json({
      success: true,
      themeName: newThemeName,
      themeId: newThemeId,
      publishedConfig: newPublishedConfig,
      savedThemes: newSavedThemes,
      updatedAt: updatePayload.updated_at,
    });
  } catch (error: any) {
    console.error("[API theme-config POST] Erreur critique:", error);
    return NextResponse.json(
      { error: error.message || "Erreur interne lors de la sauvegarde" },
      { status: 500 }
    );
  }
}
