"use client";

import { useState, useRef } from "react";
import { Upload, FileJson, Check, AlertCircle, Archive } from "lucide-react";
import { toast } from "sonner";
import JSZip from "jszip";

interface ShopifySettings {
  colors: Record<string, string>;
  fonts: { heading: string; body: string };
  social: Record<string, string>;
  layout: Record<string, any>;
  themeName: string;
}

function parseShopifyColors(schema: any[], data: Record<string, any>): Record<string, string> {
  const colors: Record<string, string> = {};
  const colorSection = schema.find((s: any) =>
    s.name?.toLowerCase().includes("color") ||
    s.settings?.some((st: any) => st.type === "color")
  );
  if (!colorSection) return colors;
  for (const setting of colorSection.settings) {
    if (setting.type === "color" && setting.id && data[setting.id]) {
      colors[setting.id] = data[setting.id];
    }
  }
  return colors;
}

function parseShopifyFonts(schema: any[], data: Record<string, any>): { heading: string; body: string } {
  const fonts = { heading: "Inter, sans-serif", body: "Inter, sans-serif" };
  const typoSection = schema.find((s: any) =>
    s.name?.toLowerCase().includes("typography") || s.name?.toLowerCase().includes("font")
  );
  if (!typoSection) return fonts;

  const mapFont = (fontVal: string): string => {
    const parts = fontVal.split("_");
    const name = parts[0] || "inter";
    const readable = name.charAt(0).toUpperCase() + name.slice(1);
    return `${readable}, sans-serif`;
  };

  for (const setting of typoSection.settings) {
    if (setting.id === "heading_font" && data.heading_font) {
      fonts.heading = mapFont(data.heading_font);
    }
    if (setting.id === "text_font" && data.text_font) {
      fonts.body = mapFont(data.text_font);
    }
  }
  return fonts;
}

function parseShopifySocial(data: Record<string, any>): Record<string, string> {
  const social: Record<string, string> = {};
  const socialKeys = ["facebook", "twitter", "instagram", "pinterest", "youtube", "linkedin", "snapchat", "tiktok"];
  for (const key of socialKeys) {
    const shopifyKey = `social_${key}`;
    if (data[shopifyKey]) social[key] = data[shopifyKey];
  }
  return social;
}

function parseShopifyLayout(schema: any[], data: Record<string, any>): Record<string, any> {
  const layout: Record<string, any> = {};
  if (data.product_image_size) layout.productImageSize = data.product_image_size;
  if (data.product_info_alignment) layout.productInfoAlignment = data.product_info_alignment;
  if (data.cart_type) layout.cartType = data.cart_type;
  if (data.product_list_horizontal_spacing) layout.horizontalSpacing = data.product_list_horizontal_spacing;
  return layout;
}

function parseShopifyTheme(
  schema: any[],
  data: Record<string, any>,
  themeName: string,
): ShopifySettings {
  return {
    colors: parseShopifyColors(schema, data),
    fonts: parseShopifyFonts(schema, data),
    social: parseShopifySocial(data),
    layout: parseShopifyLayout(schema, data),
    themeName,
  };
}

export default function TabImport({
  onImport,
}: {
  onImport: (settings: ShopifySettings) => void;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<ShopifySettings | null>(null);
  const schemaRef = useRef<any[] | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const readJSONFile = (file: File): Promise<any> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => {
        try {
          resolve(JSON.parse(e.target?.result as string));
        } catch {
          reject(new Error("Fichier JSON invalide"));
        }
      };
      reader.onerror = () => reject(new Error("Erreur de lecture"));
      reader.readAsText(file);
    });
  };

  const processFiles = async (files: FileList) => {
    const fileArray = Array.from(files);
    let schema: any[] | null = schemaRef.current;
    let data: Record<string, any> | null = null;
    let themeName = "Thème importé";

    for (const file of fileArray) {
      if (file.name.endsWith(".zip")) {
        const zip = await JSZip.loadAsync(file);

        const findFile = (name: string): string | null => {
          const exact = zip.file(name);
          if (exact) return name;
          const match = Object.keys(zip.files).find(
            (k) => !zip.files[k].dir && k.endsWith("/" + name)
          );
          return match || null;
        };

        const schemaPath = findFile("settings_schema.json");
        const dataPath = findFile("settings_data.json");

        if (schemaPath) {
          const text = await zip.file(schemaPath)!.async("text");
          try {
            schema = JSON.parse(text);
            schema = Array.isArray(schema) ? schema : [schema];
            schemaRef.current = schema;
          } catch { throw new Error("settings_schema.json invalide dans le ZIP"); }
        }
        if (dataPath) {
          const text = await zip.file(dataPath)!.async("text");
          try {
            const parsed = JSON.parse(text);
            data = parsed.current || parsed;
            themeName = data?.theme_name || file.name.replace(/\.[^/.]+$/, "");
          } catch { throw new Error("settings_data.json invalide dans le ZIP"); }
        }
        if (!schema || !data) {
          toast.error("Le ZIP doit contenir config/settings_schema.json et config/settings_data.json");
          return;
        }
      } else if (file.name.endsWith(".json")) {
        const content = await readJSONFile(file);
        if (file.name.includes("schema")) {
          schema = Array.isArray(content) ? content : [content];
          schemaRef.current = schema;
        } else if (file.name.includes("data")) {
          data = content.current || content;
          themeName = data?.theme_name || file.name.replace(/\.[^/.]+$/, "");
        }
      }
    }

    if (!schema) {
      toast.error("Fichier settings_schema.json requis");
      return;
    }
    if (!data) {
      toast.error("Fichier settings_data.json requis");
      return;
    }

    const result = parseShopifyTheme(schema, data, themeName);
    setParsed(result);
    toast.success(`Thème "${themeName}" importé avec succès !`);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) processFiles(e.dataTransfer.files);
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      await processFiles(e.target.files);
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <p className="text-xs text-gray-500">
        Importez les réglages d&apos;un thème Shopify (couleurs, polices, réseaux sociaux) pour les utiliser comme base de personnalisation.
        Déposez le fichier <code className="bg-gray-100 px-1 rounded">.zip</code> du thème, ou les fichiers <code className="bg-gray-100 px-1 rounded">settings_schema.json</code> et <code className="bg-gray-100 px-1 rounded">settings_data.json</code>.
      </p>

      <div
        onDragOver={(e) => { e.preventDefault(); setDragOver(true); }}
        onDragLeave={() => setDragOver(false)}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all ${
          dragOver
            ? "border-emerald-500 bg-emerald-50"
            : "border-gray-200 hover:border-gray-300 bg-gray-50"
        }`}
      >
        <Archive className="w-8 h-8 mx-auto mb-2 text-gray-400" />
        <p className="text-sm font-medium text-gray-600">
          {dragOver ? "Déposez les fichiers" : "Cliquez ou déposez le ZIP du thème Shopify"}
        </p>
        <p className="text-xs text-gray-400 mt-1">.zip (thème complet) ou .json (settings_schema + settings_data)</p>
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.json"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {parsed && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 space-y-3">
          <div className="flex items-center gap-2 text-emerald-700">
            <Check className="w-4 h-4" />
            <span className="text-sm font-semibold">{parsed.themeName} — importé</span>
          </div>

          {Object.keys(parsed.colors).length > 0 && (
            <div>
              <p className="text-xs font-medium text-emerald-600 mb-1">Couleurs ({Object.keys(parsed.colors).length})</p>
              <div className="flex flex-wrap gap-1.5">
                {Object.entries(parsed.colors).map(([key, val]) => (
                  <span key={key} className="inline-flex items-center gap-1 text-xs bg-white px-2 py-0.5 rounded-full border border-emerald-100">
                    <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: val }} />
                    {key}
                  </span>
                ))}
              </div>
            </div>
          )}

          <div className="text-xs text-emerald-600">
            <p>Polices : {parsed.fonts.heading} / {parsed.fonts.body}</p>
            {Object.keys(parsed.social).length > 0 && <p>Réseaux : {Object.keys(parsed.social).join(", ")}</p>}
          </div>

          <button
            onClick={() => onImport(parsed)}
            className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors"
          >
            <FileJson className="w-4 h-4" />
            Appliquer ce thème
          </button>
        </div>
      )}
    </div>
  );
}
