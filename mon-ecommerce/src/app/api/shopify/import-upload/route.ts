import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { serviceSupabase } from "@/lib/supabase-admin";

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const shopSlug = (formData.get("shopSlug") as string) || "";

    if (!file) {
      return NextResponse.json({ error: "Fichier ZIP requis" }, { status: 400 });
    }
    if (!shopSlug) {
      return NextResponse.json({ error: "shopSlug requis" }, { status: 400 });
    }

    // Ensure bucket exists (server-side with service role)
    const bucketName = "shopify-imports";
    const { data: existingBucket, error: getError } = await serviceSupabase.storage.getBucket(bucketName);
    if (getError?.message?.toLowerCase().includes("not found") || !existingBucket) {
      const { error: createError } = await serviceSupabase.storage.createBucket(bucketName, { public: true });
      if (createError) throw new Error("Impossible de créer le bucket: " + createError.message);
    } else if (getError) {
      throw new Error("Erreur de vérification du bucket: " + (getError as any).message);
    }

    // Upload ZIP to storage
    const buffer = Buffer.from(await file.arrayBuffer());
    const zipPath = `${shopSlug}/${Date.now()}-${file.name}`;
    const blob = new Blob([buffer], { type: "application/zip" });
    const { data: uploadData, error: uploadError } = await serviceSupabase.storage
      .from(bucketName)
      .upload(zipPath, blob, { upsert: true, contentType: "application/zip" });

    if (uploadError) throw new Error(uploadError.message);

    const { data: { publicUrl } } = serviceSupabase.storage
      .from(bucketName)
      .getPublicUrl(uploadData.path);

    // Process the ZIP directly (no need to re-download, we already have the buffer)
    const zip = await JSZip.loadAsync(buffer);

    const findFile = (name: string): string | null => {
      const match = Object.keys(zip.files).find(
        (k) => !zip.files[k].dir && k.endsWith("/" + name)
      );
      return match || null;
    };

    // ── 1. Config ──
    const settings: Record<string, any> = {
      colors: {}, fonts: { heading: "", body: "" }, social: {}, layout: {}, themeName: "",
    };

    const schemaPath = findFile("settings_schema.json");
    const dataPath = findFile("settings_data.json");

    if (schemaPath && dataPath) {
      const schemaText = await zip.file(schemaPath)!.async("text");
      const dataText = await zip.file(dataPath)!.async("text");
      const schema = JSON.parse(schemaText);
      const rawData = JSON.parse(dataText);
      const data = rawData.current || rawData;

      settings.themeName = data?.theme_name || "";

      const schemaArr = Array.isArray(schema) ? schema : [schema];
      const colorSection = schemaArr.find((s: any) =>
        s.name?.toLowerCase().includes("color") ||
        s.settings?.some((st: any) => st.type === "color")
      );
      if (colorSection) {
        for (const st of colorSection.settings || []) {
          if (st.type === "color" && st.id && data[st.id]) settings.colors[st.id] = data[st.id];
        }
      }

      const typoSection = schemaArr.find((s: any) =>
        s.name?.toLowerCase().includes("typography") || s.name?.toLowerCase().includes("font")
      );
      if (typoSection) {
        for (const st of typoSection.settings || []) {
          if (st.id === "heading_font" && data.heading_font) settings.fonts.heading = data.heading_font;
          if (st.id === "text_font" && data.text_font) settings.fonts.body = data.text_font;
        }
      }

      for (const key of ["facebook", "twitter", "instagram", "pinterest", "youtube", "linkedin", "snapchat", "tiktok"]) {
        if (data[`social_${key}`]) settings.social[key] = data[`social_${key}`];
      }

      if (data.product_image_size) settings.layout.productImageSize = data.product_image_size;
      if (data.product_info_alignment) settings.layout.productInfoAlignment = data.product_info_alignment;
      if (data.cart_type) settings.layout.cartType = data.cart_type;
    }

    // ── 2. CSS ──
    let combinedCss = "";
    const cssFiles = Object.keys(zip.files).filter(
      (k) => !zip.files[k].dir && k.endsWith(".css") && k.includes("/assets/")
    );
    for (const path of cssFiles) {
      const content = await zip.file(path)!.async("text");
      combinedCss += `/* ${path.split("/").pop()} */\n${content}\n\n`;
    }

    // ── 3. Assets ──
    const assetExtensions = [".png", ".jpg", ".jpeg", ".gif", ".svg", ".webp", ".woff", ".woff2", ".ttf", ".eot", ".ico"];
    const assetPaths = Object.keys(zip.files).filter((k) => {
      if (zip.files[k].dir) return false;
      const ext = k.toLowerCase().split(".").pop();
      return ext && assetExtensions.includes("." + ext) && k.includes("/assets/");
    });

    const getMimeType = (fn: string): string => {
      const ext = fn.split(".").pop()?.toLowerCase();
      const map: Record<string, string> = {
        png: "image/png", jpg: "image/jpeg", jpeg: "image/jpeg",
        gif: "image/gif", svg: "image/svg+xml", webp: "image/webp",
        woff: "font/woff", woff2: "font/woff2", ttf: "font/ttf",
        eot: "application/vnd.ms-fontobject", ico: "image/x-icon",
      };
      return map[ext || ""] || "application/octet-stream";
    };

    const uploadedAssets: { name: string; url: string }[] = [];
    for (const path of assetPaths) {
      const fileName = path.split("/").pop() || path;
      const fileData = await zip.file(path)!.async("arraybuffer");
      const storagePath = `${shopSlug}/assets/${fileName}`;
      const assetBlob = new Blob([fileData], { type: getMimeType(fileName) });
      const { data: uploadData, error } = await serviceSupabase.storage
        .from(bucketName)
        .upload(storagePath, assetBlob, { upsert: true, contentType: getMimeType(fileName) });

      if (!error) {
        const { data: { publicUrl } } = serviceSupabase.storage
          .from(bucketName)
          .getPublicUrl(uploadData.path);
        uploadedAssets.push({ name: fileName, url: publicUrl });
      }
    }

    // ── 4. Liquid templates ──
    const liquidFiles: { name: string; path: string; content: string }[] = [];
    const liquidPaths = Object.keys(zip.files).filter(
      (k) => !zip.files[k].dir && (k.endsWith(".liquid") || k.endsWith(".json"))
    );
    for (const path of liquidPaths) {
      const content = await zip.file(path)!.async("text");
      liquidFiles.push({ name: path.split("/").pop() || path, path, content: content.slice(0, 5000) });
    }

    return NextResponse.json({
      zipUrl: publicUrl,
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
