import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { serviceSupabase } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const { zipUrl, shopSlug } = await request.json();
    if (!zipUrl || !shopSlug) {
      return NextResponse.json({ error: "zipUrl et shopSlug requis" }, { status: 400 });
    }

    // Download the ZIP
    const zipRes = await fetch(zipUrl);
    if (!zipRes.ok) throw new Error("Impossible de télécharger le ZIP");
    const zipBuffer = await zipRes.arrayBuffer();
    const zip = await JSZip.loadAsync(zipBuffer);

    // Find files recursively
    const findFile = (name: string): string | null => {
      const match = Object.keys(zip.files).find(
        (k) => !zip.files[k].dir && k.endsWith("/" + name)
      );
      return match || null;
    };

    // ── 1. Config (settings) ──
    let settings: Record<string, any> = { colors: {}, fonts: { heading: "", body: "" }, social: {}, layout: {} };

    const schemaPath = findFile("settings_schema.json");
    const dataPath = findFile("settings_data.json");

    if (schemaPath && dataPath) {
      const schemaText = await zip.file(schemaPath)!.async("text");
      const dataText = await zip.file(dataPath)!.async("text");
      const schema = JSON.parse(schemaText);
      const rawData = JSON.parse(dataText);
      const data = rawData.current || rawData;
      const themeName = data?.theme_name || "";

      settings.themeName = themeName;

      // Colors
      const colorSection = (Array.isArray(schema) ? schema : [schema]).find((s: any) =>
        s.name?.toLowerCase().includes("color") ||
        s.settings?.some((st: any) => st.type === "color")
      );
      if (colorSection) {
        for (const st of colorSection.settings || []) {
          if (st.type === "color" && st.id && data[st.id]) {
            settings.colors[st.id] = data[st.id];
          }
        }
      }

      // Fonts
      const typoSection = (Array.isArray(schema) ? schema : [schema]).find((s: any) =>
        s.name?.toLowerCase().includes("typography") || s.name?.toLowerCase().includes("font")
      );
      if (typoSection) {
        for (const st of typoSection.settings || []) {
          if (st.id === "heading_font" && data.heading_font) {
            settings.fonts.heading = data.heading_font;
          }
          if (st.id === "text_font" && data.text_font) {
            settings.fonts.body = data.text_font;
          }
        }
      }

      // Social
      const socialKeys = ["facebook", "twitter", "instagram", "pinterest", "youtube", "linkedin", "snapchat", "tiktok"];
      for (const key of socialKeys) {
        if (data[`social_${key}`]) settings.social[key] = data[`social_${key}`];
      }

      // Layout
      if (data.product_image_size) settings.layout.productImageSize = data.product_image_size;
      if (data.product_info_alignment) settings.layout.productInfoAlignment = data.product_info_alignment;
      if (data.cart_type) settings.layout.cartType = data.cart_type;
    }

    // ── 2. CSS — combine all .css from assets ──
    let combinedCss = "";
    const cssFiles = Object.keys(zip.files).filter(
      (k) => !zip.files[k].dir && k.endsWith(".css") && k.includes("/assets/")
    );
    for (const path of cssFiles) {
      const content = await zip.file(path)!.async("text");
      combinedCss += `/* ${path.split("/").pop()} */\n${content}\n\n`;
    }

    // ── 3. Assets — upload images/fonts to Supabase storage ──
    const assetExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".woff", ".woff2", ".ttf", ".eot", ".ico"];
    const assetPaths = Object.keys(zip.files).filter((k) => {
      if (zip.files[k].dir) return false;
      const ext = k.toLowerCase().split(".").pop();
      const match = ext && assetExtensions.includes("." + ext);
      return match && k.includes("/assets/");
    });

    const bucketName = "shopify-imports";
    const { error: createError } = await serviceSupabase.storage.createBucket(bucketName, { public: true });
    if (createError && !createError.message?.includes("already exists")) {
      throw new Error("Impossible de créer le bucket: " + createError.message);
    }

    const uploadedAssets: { name: string; url: string }[] = [];
    for (const path of assetPaths) {
      const fileName = path.split("/").pop() || path;
      const fileData = await zip.file(path)!.async("arraybuffer");
      const storagePath = `${shopSlug}/assets/${fileName}`;
      const { error } = await serviceSupabase.storage
        .from(bucketName)
        .upload(storagePath, fileData, { upsert: true, contentType: getMimeType(fileName) });

      if (!error) {
        const { data: { publicUrl } } = serviceSupabase.storage
          .from(bucketName)
          .getPublicUrl(storagePath);
        uploadedAssets.push({ name: fileName, url: publicUrl });
      }
    }

    // ── 4. Liquid templates (structure reference) ──
    const liquidFiles: { name: string; path: string; content: string }[] = [];
    const liquidPaths = Object.keys(zip.files).filter(
      (k) => !zip.files[k].dir && (k.endsWith(".liquid") || k.endsWith(".json"))
    );
    for (const path of liquidPaths) {
      const content = await zip.file(path)!.async("text");
      liquidFiles.push({
        name: path.split("/").pop() || path,
        path,
        content: content.slice(0, 5000),
      });
    }

    return NextResponse.json({
      settings,
      css: combinedCss,
      assets: uploadedAssets,
      liquidFiles: liquidFiles.slice(0, 20),
      totalFiles: Object.keys(zip.files).filter((k) => !zip.files[k].dir).length,
    });
  } catch (error: any) {
    console.error("Shopify import error:", error);
    return NextResponse.json({ error: error.message || "Erreur d'import" }, { status: 500 });
  }
}

function getMimeType(fileName: string): string {
  const ext = fileName.split(".").pop()?.toLowerCase();
  const mimeMap: Record<string, string> = {
    png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
    gif: "image/gif", svg: "image/svg+xml", webp: "image/webp",
    woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf",
    eot: "application/vnd.ms-fontobject", ico: "image/x-icon",
  };
  return mimeMap[ext || ""] || "application/octet-stream";
}
