import { NextRequest, NextResponse } from "next/server";
import JSZip from "jszip";
import { serviceSupabase } from "@/lib/supabase-admin";
import { buildDefaultConfig, ThemeConfig } from "@/lib/theme-config";

export const runtime = "nodejs";

const SHOPIFY_FONT_MAP: Record<string, string> = {
  helvetica: "Helvetica, sans-serif",
  arial: "Arial, sans-serif",
  garamond: "Garamond, serif",
  georgia: "Georgia, serif",
  times: "Times New Roman, serif",
  inter: "Inter, sans-serif",
  poppins: "Poppins, sans-serif",
  montserrat: "Montserrat, sans-serif",
  roboto: "Roboto, sans-serif",
  lato: "Lato, sans-serif",
  raleway: "Raleway, sans-serif",
  nunito: "Nunito, sans-serif",
  playfair: "Playfair Display, serif",
  merriweather: "Merriweather, serif",
  "open sans": "Open Sans, sans-serif",
  open_sans: "Open Sans, sans-serif",
  "source sans": "Source Sans 3, sans-serif",
  lora: "Lora, serif",
  "dm sans": "DM Sans, sans-serif",
  assistant: "Assistant, sans-serif",
};

function normalizeFont(rawFont?: string): string {
  if (!rawFont) return "Poppins, sans-serif";
  const familyPart = rawFont.split("_")[0].toLowerCase().replace(/-/g, " ");
  if (SHOPIFY_FONT_MAP[familyPart]) return SHOPIFY_FONT_MAP[familyPart];
  const cap = familyPart.charAt(0).toUpperCase() + familyPart.slice(1);
  return `${cap}, sans-serif`;
}

function cleanShopifyUrl(url?: string): string {
  if (!url) return "";
  if (url.includes("collections/all") || url.includes("/collections")) return "/products";
  if (url.includes("pages/contact") || url.includes("/contact")) return "/contact";
  if (url.startsWith("shopify://")) return "/" + url.replace("shopify://", "");
  return url;
}

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

    // 1. Charger et parser le ZIP en mémoire
    const buffer = Buffer.from(await file.arrayBuffer());
    const zip = await JSZip.loadAsync(buffer);

    const findFile = (name: string): string | null => {
      const match = Object.keys(zip.files).find(
        (k) => !zip.files[k].dir && k.endsWith("/" + name)
      );
      return match || null;
    };

    // 2. Extraire la configuration du thème
    const settings: Record<string, any> = {
      colors: {},
      fonts: { heading: "Poppins, sans-serif", body: "Poppins, sans-serif" },
      social: {},
      layout: {},
      themeName: "",
      announcement: null,
      hero: null,
      header: null,
      footer: null,
    };

    const schemaPath = findFile("settings_schema.json");
    const dataPath = findFile("settings_data.json");

    let schema: any[] = [];
    let data: Record<string, any> = {};

    if (dataPath) {
      const dataText = await zip.file(dataPath)!.async("text");
      try {
        const rawData = JSON.parse(dataText);
        data = rawData.current || rawData;
      } catch (e) {
        console.warn("Erreur parsing settings_data.json:", e);
      }
    }

    if (schemaPath) {
      const schemaText = await zip.file(schemaPath)!.async("text");
      try {
        const rawSchema = JSON.parse(schemaText);
        schema = Array.isArray(rawSchema) ? rawSchema : [rawSchema];
      } catch (e) {
        console.warn("Erreur parsing settings_schema.json:", e);
      }
    }

    // Extraction du nom du thème : Nettoyage du nom de fichier + Nom du moteur de template
    const themeInfo = schema.find((s) => s.name === "theme_info" || s.theme_name);
    const schemaThemeName = data?.theme_name || themeInfo?.theme_name || "";

    const cleanFileName = file.name
      .replace(/\.zip$/i, "")
      .replace(/^theme[-_]/i, "")
      .replace(/[-_]/g, " ")
      .trim();
    const titleCaseFileName = cleanFileName
      ? cleanFileName
          .split(" ")
          .map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase())
          .join(" ")
      : "";

    if (
      titleCaseFileName &&
      schemaThemeName &&
      titleCaseFileName.toLowerCase() !== schemaThemeName.toLowerCase()
    ) {
      settings.themeName = `${titleCaseFileName} (${schemaThemeName})`;
    } else {
      settings.themeName = titleCaseFileName || schemaThemeName || "Thème Shopify importé";
    }

    // Extraire TOUTES les couleurs hexadécimales présentes dans les réglages
    for (const [key, val] of Object.entries(data)) {
      if (
        typeof val === "string" &&
        val.startsWith("#") &&
        (val.length === 4 || val.length === 7 || val.length === 9)
      ) {
        settings.colors[key] = val;
      }
    }

    // Extraire les polices typographiques
    if (data.heading_font) settings.fonts.heading = normalizeFont(data.heading_font);
    if (data.text_font) settings.fonts.body = normalizeFont(data.text_font);

    // Réseaux sociaux
    for (const key of [
      "facebook",
      "twitter",
      "instagram",
      "pinterest",
      "youtube",
      "linkedin",
      "snapchat",
      "tiktok",
    ]) {
      if (data[`social_${key}`]) settings.social[key] = data[`social_${key}`];
    }

    // Bannière d'annonce
    if (data.sections?.announcement?.settings) {
      settings.announcement = data.sections.announcement.settings;
    }

    // En-tête (header)
    if (data.sections?.header?.settings) {
      settings.header = data.sections.header.settings;
    }

    // Pied de page (footer)
    if (data.sections?.footer) {
      settings.footer = data.sections.footer;
    }

    // Hero / Slideshow
    for (const [secKey, sec] of Object.entries(data.sections || {})) {
      const s = sec as any;
      if (s.type === "slideshow" && s.blocks) {
        for (const block of Object.values(s.blocks)) {
          const b = block as any;
          if (b.settings?.title || b.settings?.subheading) {
            settings.hero = {
              title: b.settings.title || "",
              subheading: b.settings.subheading || "",
              buttonText: b.settings.button_1_text || "Voir nos produits",
              buttonUrl: cleanShopifyUrl(b.settings.button_1_link) || "/products",
            };
            break;
          }
        }
      }
    }

    // 3. CONSTRUIRE UN VRAI THEME CONFIG SHOPEAZY COMPLET ET VISUELLEMENT TRANSFORMÉ
    const themeConfig: ThemeConfig = buildDefaultConfig("classic");

    // A. Palette de couleurs
    const colors = settings.colors;
    const primary =
      colors.navigation_background ||
      colors.color_primary ||
      colors.primary_color ||
      colors.colors_accent_1 ||
      colors.product_on_sale_color ||
      "#0e4d20";

    const secondary = colors.product_on_sale_color || colors.accent_color || "#2d793a";
    const text = colors.text_color || colors.heading_color || colors.colors_text || "#1c1b1b";
    const textMuted = colors.text_light_color || colors.link_color || "#6a6a6a";
    const background =
      colors.background || colors.light_background || colors.color_background_1 || "#ffffff";
    const headerBg = colors.header_background || "#ffffff";
    const buttonBg = colors.button_background || "#1c1b1b";
    const buttonText = colors.button_text_color || "#ffffff";

    themeConfig.global.colors = {
      ...themeConfig.global.colors,
      primary,
      primaryHover: "#0b3d19",
      secondary,
      accent: secondary,
      background,
      surface: "#ffffff",
      text,
      textMuted,
      border: "#e5e7eb",
      link: primary,
      buttonText,
      headerBg,
      headerText: text,
      footerBg: colors.footer_background || "#ffffff",
      footerText: colors.footer_text_color || textMuted,
    };

    // B. Typographies
    themeConfig.global.fonts = {
      ...themeConfig.global.fonts,
      heading: settings.fonts.heading || "Poppins, sans-serif",
      body: settings.fonts.body || "Poppins, sans-serif",
      headingWeight: 600,
      bodyWeight: 400,
    };

    // C. Brand
    themeConfig.brand = {
      ...themeConfig.brand,
      themeColor: primary,
      logoMaxWidth: settings.header?.logo_max_width || 220,
    };

    // D. Mise à jour de la bannière d'annonce
    const announcementText =
      settings.announcement?.content || "LIVRAISON GRATUITE PARTOUT AU TOGO";
    const announcementBg = settings.announcement?.background || primary;
    const announcementTextColor = settings.announcement?.text_color || "#ffffff";
    const isAnnouncementEnabled =
      settings.announcement?.enable_bar !== undefined ? !!settings.announcement.enable_bar : true;

    // E. Mise à jour des sections globales et du corps de page
    const updatedSections = themeConfig.sections.map((sec) => {
      // 1. Bannière d'annonce
      if (sec.type === "announcement-bar" || sec.type === "announcement") {
        return {
          ...sec,
          disabled: !isAnnouncementEnabled,
          settings: {
            ...sec.settings,
            background: announcementBg,
            text_color: announcementTextColor,
            messages: [{ id: "ann-1", text: announcementText, url: "" }],
          },
        };
      }

      // 2. En-tête
      if (sec.type === "header") {
        return {
          ...sec,
          settings: {
            ...sec.settings,
            sticky: settings.header?.use_sticky_header ?? true,
            logo_max_width: settings.header?.logo_max_width || 220,
            navigation_style: settings.header?.navigation_style || "center",
          },
        };
      }

      // 3. Hero banner
      if (sec.type === "image-banner") {
        const heroTitle = settings.hero?.title || "NOS PRODUITS, VOS SOLUTIONS.";
        const heroSub = settings.hero?.subheading || "DEBUTEZ L'AVENTURE AVEC NOUS";
        const heroBtnText = settings.hero?.buttonText || "VISITER";
        const heroBtnUrl = settings.hero?.buttonUrl || "/products";

        return {
          ...sec,
          disabled: false,
          settings: {
            ...sec.settings,
            title: heroTitle,
            subheading: heroSub,
            button_text: heroBtnText,
            button_url: heroBtnUrl,
            background: primary,
            button_style: "solid",
            overlay_opacity: 0.35,
            text_color: "#ffffff",
          },
        };
      }

      // 4. Slideshow
      if (sec.type === "slideshow") {
        const heroTitle = settings.hero?.title || "NOS PRODUITS, VOS SOLUTIONS.";
        const heroSub = settings.hero?.subheading || "DEBUTEZ L'AVENTURE AVEC NOUS";
        const heroBtnText = settings.hero?.buttonText || "VISITER";
        const heroBtnUrl = settings.hero?.buttonUrl || "/products";

        return {
          ...sec,
          disabled: false,
          settings: {
            ...sec.settings,
            autoplay: true,
            speed: 5000,
            full_width: true,
          },
          blocks: [
            {
              id: "slide-imported-1",
              type: "slide",
              settings: {
                heading: heroTitle,
                subheading: heroSub,
                button_text: heroBtnText,
                button_url: heroBtnUrl,
                text_color: "#ffffff",
                heading_size: "xlarge",
                overlay_opacity: 0.35,
              },
            },
          ],
        };
      }

      // 5. Produits vedettes
      if (sec.type === "featured-products") {
        return {
          ...sec,
          settings: {
            ...sec.settings,
            title: "Nos Produits",
            description: "Découvrez notre sélection exclusive soigneusement choisie pour vous.",
          },
        };
      }

      // 6. Pied de page
      if (sec.type === "footer") {
        return {
          ...sec,
          blocks: [
            {
              id: "footer_text",
              type: "text",
              settings: {
                title: "NOS CONTACTS",
                content:
                  "contact@boutique.com — Ouvert 24h/24, 7j/7 — Nous sommes à votre service, vous servir est notre satisfaction.",
                show_social_media: true,
              },
            },
            {
              id: "footer_links",
              type: "links",
              settings: {
                title: "Liens rapides",
                links: [
                  { label: "Accueil", url: "/" },
                  { label: "Produits", url: "/products" },
                ],
              },
            },
          ],
        };
      }

      return sec;
    });

    themeConfig.sections = updatedSections;

    // F. Synchroniser avec la page d'accueil dans `pages[0]`
    if (themeConfig.pages && themeConfig.pages.length > 0) {
      themeConfig.pages[0].sections = updatedSections.filter(
        (s) => s.type !== "announcement-bar" && s.type !== "header" && s.type !== "footer"
      );
    }

    // G. CSS personnalisé propre et ciblé
    const customCleanCss = `/* Thème importé : ${settings.themeName} */
:root {
  --theme-primary: ${primary};
  --theme-primary-hover: #0b3d19;
  --theme-accent: ${secondary};
  --theme-text: ${text};
}
`;
    themeConfig.customCss = {
      desktop: customCleanCss,
      mobile: customCleanCss,
    };

    // 4. Sauvegarde optionnelle du ZIP dans le bucket storage (non bloquante)
    let publicZipUrl = "";
    try {
      const bucketName = "shopify-imports";
      const zipPath = `${shopSlug}/${Date.now()}-${file.name}`;
      const blob = new Blob([buffer], { type: "application/zip" });
      const { data: uploadData, error: uploadError } = await serviceSupabase.storage
        .from(bucketName)
        .upload(zipPath, blob, { upsert: true, contentType: "application/zip" });

      if (!uploadError && uploadData) {
        const { data: pubData } = serviceSupabase.storage
          .from(bucketName)
          .getPublicUrl(uploadData.path);
        publicZipUrl = pubData?.publicUrl || "";
      }
    } catch (storageErr) {
      console.warn("[Shopify Import] Stockage ZIP ignoré:", storageErr);
    }

    return NextResponse.json({
      success: true,
      zipUrl: publicZipUrl,
      themeName: settings.themeName,
      themeConfig,
      settings,
      totalFiles: Object.keys(zip.files).filter((k) => !zip.files[k].dir).length,
    });
  } catch (error: any) {
    console.error("[Shopify Import] Erreur critique:", error);
    return NextResponse.json(
      { error: error.message || "Erreur lors du traitement du thème Shopify." },
      { status: 500 }
    );
  }
}
