"use client";

import { useState, useRef } from "react";
import { Upload, FileJson, Check, AlertCircle, Archive, Code, ImageIcon, FileText } from "lucide-react";
import { toast } from "sonner";

interface ShopifySettings {
  colors: Record<string, string>;
  fonts: { heading: string; body: string };
  social: Record<string, string>;
  layout: Record<string, any>;
  analytics: Record<string, string>;
  themeName: string;
}

interface ImportResult {
  settings: ShopifySettings;
  css: string;
  assets: { name: string; url: string }[];
  liquidFiles: { name: string; path: string; content: string }[];
  totalFiles: number;
}

export default function TabImport({
  onImport,
  onApplyCss,
  shopSlug,
}: {
  onImport: (settings: ShopifySettings) => void;
  onApplyCss?: (css: string) => void;
  shopSlug?: string;
}) {
  const [dragOver, setDragOver] = useState(false);
  const [parsed, setParsed] = useState<ShopifySettings | null>(null);
  const [fullResult, setFullResult] = useState<ImportResult | null>(null);
  const [loading, setLoading] = useState(false);
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

  const importZipViaApi = async (zipFile: File) => {
    setLoading(true);
    try {
      const formData = new FormData();
      formData.append("file", zipFile);
      formData.append("shopSlug", shopSlug || "");

      const res = await fetch("/api/shopify/import-upload", {
        method: "POST",
        body: formData,
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error);

      setFullResult(result);
      setParsed(result.settings);
      toast.success(`Thème "${result.settings.themeName || "Importé"}" — ${result.totalFiles} fichiers`);
    } catch (e: any) {
      toast.error(e.message || "Erreur d'import");
    } finally {
      setLoading(false);
    }
  };

  const processFiles = async (files: FileList) => {
    const fileArray = Array.from(files);

    // If ZIP → send to API
    const zipFile = fileArray.find((f) => f.name.endsWith(".zip"));
    if (zipFile) {
      await importZipViaApi(zipFile);
      return;
    }

    // Otherwise handle JSON client-side (legacy)
    let schema: any[] | null = schemaRef.current;
    let data: Record<string, any> | null = null;
    let themeName = "Thème importé";

    for (const file of fileArray) {
      if (!file.name.endsWith(".json")) continue;
      const content = await readJSONFile(file);
      if (file.name.includes("schema")) {
        schema = Array.isArray(content) ? content : [content];
        schemaRef.current = schema;
      } else if (file.name.includes("data")) {
        data = content.current || content;
        themeName = data?.theme_name || file.name.replace(/\.[^/.]+$/, "");
      }
    }

    if (!schema) { toast.error("Fichier settings_schema.json requis"); return; }
    if (!data) { toast.error("Fichier settings_data.json requis"); return; }

    const result = parseShopifyTheme(schema, data, themeName);
    setFullResult(null);
    setParsed(result);
    toast.success(`Thème "${themeName}" importé !`);
  };

  const handleDrop = async (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    if (e.dataTransfer.files.length > 0) {
      try {
        await processFiles(e.dataTransfer.files);
      } catch (e: any) {
        toast.error(e.message || "Erreur lors du traitement des fichiers");
      }
    }
  };

  const handleFileInput = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      try {
        await processFiles(e.target.files);
      } catch (e: any) {
        toast.error(e.message || "Erreur lors du traitement des fichiers");
      }
      e.target.value = "";
    }
  };

  return (
    <div className="space-y-5">
      <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-3 flex items-center gap-3">
        <div className="w-7 h-7 rounded-lg bg-amber-100 flex items-center justify-center shrink-0">
          <svg className="w-4 h-4 text-amber-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-semibold text-amber-800">Fonctionnalité en développement</p>
          <p className="text-xs text-amber-700">L&apos;import Shopify est encore en cours d&apos;amélioration — certains éléments peuvent ne pas être parfaitement compatibles.</p>
        </div>
      </div>
      <p className="text-xs text-gray-500">
        Importez un thème Shopify complet — couleurs, polices, CSS, images et assets sont extraits automatiquement.
        Déposez le fichier <code className="bg-gray-100 px-1 rounded">.zip</code> du thème ou les fichiers JSON individuels.
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
        {loading ? (
          <div className="flex flex-col items-center gap-2">
            <div className="w-8 h-8 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin" />
            <p className="text-sm font-medium text-emerald-600">Import en cours...</p>
            <p className="text-xs text-gray-400">Extraction, parsing, upload des assets</p>
          </div>
        ) : (
          <>
            <Archive className="w-8 h-8 mx-auto mb-2 text-gray-400" />
            <p className="text-sm font-medium text-gray-600">
              {dragOver ? "Déposez le fichier" : "Cliquez ou déposez le ZIP du thème Shopify"}
            </p>
            <p className="text-xs text-gray-400 mt-1">.zip (thème complet) ou .json (settings_schema + settings_data)</p>
          </>
        )}
        <input
          ref={fileInputRef}
          type="file"
          accept=".zip,.json"
          multiple
          onChange={handleFileInput}
          className="hidden"
        />
      </div>

      {/* Legacy JSON result */}
      {parsed && !fullResult && (
        <JsonResult parsed={parsed} onImport={onImport} />
      )}

      {/* Full ZIP import result */}
      {fullResult && (
        <FullResult
          result={fullResult}
          onImport={onImport}
          onApplyCss={onApplyCss}
        />
      )}
    </div>
  );
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

  const SHOPIFY_FONT_MAP: Record<string, string> = {
    helvetica: "Helvetica, sans-serif",
    "helvetica neue": "Helvetica Neue, sans-serif",
    "helvetica_neue": "Helvetica Neue, sans-serif",
    arial: "Arial, sans-serif",
    garamond: "Garamond, serif",
    georgia: "Georgia, serif",
    times: "Times New Roman, serif",
    "times new roman": "Times New Roman, serif",
    inter: "Inter, sans-serif",
    "open sans": "Open Sans, sans-serif",
    open_sans: "Open Sans, sans-serif",
    lato: "Lato, sans-serif",
    montserrat: "Montserrat, sans-serif",
    raleway: "Raleway, sans-serif",
    roboto: "Roboto, sans-serif",
    poppins: "Poppins, sans-serif",
    nunito: "Nunito, sans-serif",
    ubuntu: "Ubuntu, sans-serif",
    oswald: "Oswald, sans-serif",
    playfair: "Playfair Display, serif",
    "playfair display": "Playfair Display, serif",
    merriweather: "Merriweather, serif",
    "source sans": "Source Sans 3, sans-serif",
    "source sans pro": "Source Sans 3, sans-serif",
    "pt sans": "PT Sans, sans-serif",
    "pt serif": "PT Serif, serif",
    lora: "Lora, serif",
    "fira sans": "Fira Sans, sans-serif",
    "josefin sans": "Josefin Sans, sans-serif",
    quattrocento: "Quattrocento, serif",
    "tenor sans": "Tenor Sans, sans-serif",
    "tenor": "Tenor Sans, sans-serif",
    "dm sans": "DM Sans, sans-serif",
    assistant: "Assistant, sans-serif",
  };

  const normalize = (name: string) => name.toLowerCase().replace(/_/g, " ");

  const mapFont = (fontVal: string): string => {
    const parts = fontVal.split("_");
    const familyPart = parts[0] || "inter";
    const weightPart = parts[1];

    const normalized = normalize(familyPart.replace(/-/g, " "));
    const mapped = SHOPIFY_FONT_MAP[familyPart] || SHOPIFY_FONT_MAP[normalized];
    if (mapped) return mapped;

    const name = familyPart.charAt(0).toUpperCase() + familyPart.slice(1);
    return `${name}, sans-serif`;
  };

  for (const setting of typoSection.settings) {
    if (setting.id === "heading_font" && data.heading_font) fonts.heading = mapFont(data.heading_font);
    if (setting.id === "text_font" && data.text_font) fonts.body = mapFont(data.text_font);
  }
  return fonts;
}

function parseShopifySocial(data: Record<string, any>): Record<string, string> {
  const social: Record<string, string> = {};
  const socialKeys = ["facebook", "twitter", "instagram", "pinterest", "youtube", "linkedin", "snapchat", "tiktok"];
  for (const key of socialKeys) {
    if (data[`social_${key}`]) social[key] = data[`social_${key}`];
  }
  return social;
}

function parseShopifyLayout(schema: any[], data: Record<string, any>): Record<string, any> {
  const layout: Record<string, any> = {};
  if (data.product_image_size) layout.productImageSize = data.product_image_size;
  if (data.product_info_alignment) layout.productInfoAlignment = data.product_info_alignment;
  if (data.cart_type) layout.cartType = data.cart_type;
  if (data.product_list_horizontal_spacing) layout.sectionSpacing = data.product_list_horizontal_spacing;
  if (data.page_width) layout.containerWidth = data.page_width;
  if (data.products_per_row) layout.productsPerRow = typeof data.products_per_row === "number" ? data.products_per_row as 2 | 3 | 4 : 4;
  if (data.products_per_row_mobile) layout.mobileProductsPerRow = typeof data.products_per_row_mobile === "number" ? data.products_per_row_mobile as 1 | 2 : 2;
  if (data.collection_layout) layout.collectionLayout = data.collection_layout;
  if (typeof data.show_search !== "undefined") layout.showSearch = data.show_search;
  if (typeof data.show_cart !== "undefined") layout.showCart = data.show_cart;
  if (typeof data.show_breadcrumbs !== "undefined") layout.showBreadcrumbs = data.show_breadcrumbs;
  if (typeof data.show_filters !== "undefined") layout.showFilters = data.show_filters;
  if (typeof data.show_wishlist !== "undefined") layout.showWishlist = data.show_wishlist;
  if (typeof data.show_badges !== "undefined") layout.showBadges = data.show_badges;
  if (data.header_style) layout.headerStyle = data.header_style;
  if (typeof data.sticky_header !== "undefined") layout.stickyHeader = data.sticky_header;
  if (data.footer_columns) layout.footerColumns = typeof data.footer_columns === "number" ? data.footer_columns as 1 | 2 | 3 | 4 : 3;
  return layout;
}

function parseShopifyTheme(schema: any[], data: Record<string, any>, themeName: string): ShopifySettings {
  return {
    colors: parseShopifyColors(schema, data),
    fonts: parseShopifyFonts(schema, data),
    social: parseShopifySocial(data),
    layout: parseShopifyLayout(schema, data),
    analytics: parseShopifyAnalytics(data),
    themeName,
  };
}

function parseShopifyAnalytics(data: Record<string, any>): Record<string, string> {
  const analytics: Record<string, string> = {};
  if (data.google_analytics) analytics.googleAnalytics = data.google_analytics;
  if (data.google_tag_manager) analytics.googleTagManager = data.google_tag_manager;
  if (data.facebook_pixel) analytics.facebookPixel = data.facebook_pixel;
  if (data.custom_head_scripts) analytics.customHeadScripts = data.custom_head_scripts;
  return analytics;
}

function JsonResult({ parsed, onImport }: { parsed: ShopifySettings; onImport: (s: ShopifySettings) => void }) {
  return (
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
      <button onClick={() => onImport(parsed)}
        className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors">
        <FileJson className="w-4 h-4" /> Appliquer ce thème
      </button>
    </div>
  );
}

function FullResult({
  result,
  onImport,
  onApplyCss,
}: {
  result: ImportResult;
  onImport: (s: ShopifySettings) => void;
  onApplyCss?: (css: string) => void;
}) {
  const [cssExpanded, setCssExpanded] = useState(false);
  const [assetsExpanded, setAssetsExpanded] = useState(false);
  const [liquidExpanded, setLiquidExpanded] = useState(false);

  return (
    <div className="space-y-3">
      {/* Summary */}
      <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
        <div className="flex items-center gap-2 text-emerald-700 mb-1">
          <Check className="w-4 h-4" />
          <span className="text-sm font-semibold">{result.settings.themeName || "Thème importé"}</span>
          <span className="text-xs text-emerald-500 ml-auto">{result.totalFiles} fichiers</span>
        </div>
        <div className="flex flex-wrap gap-3 mt-2 text-xs text-emerald-600">
          <span>🎨 {Object.keys(result.settings.colors).length} couleurs</span>
          <span>📄 {result.css ? `${(result.css.length / 1024).toFixed(0)} Ko CSS` : "0 CSS"}</span>
          <span>🖼️ {result.assets.length} assets</span>
          <span>📁 {result.liquidFiles.length} templates</span>
        </div>
      </div>

      {/* Settings (same as legacy) */}
      <div className="bg-white border border-gray-200 rounded-xl p-4 space-y-2">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider">Couleurs</p>
        <div className="flex flex-wrap gap-1.5">
          {Object.entries(result.settings.colors).map(([key, val]) => (
            <span key={key} className="inline-flex items-center gap-1 text-xs bg-gray-50 px-2 py-0.5 rounded-full border border-gray-100">
              <span className="w-3 h-3 rounded-full border border-white shadow-sm" style={{ background: val }} />
              {key}
            </span>
          ))}
        </div>
        <p className="text-xs text-gray-500">Polices : {result.settings.fonts.heading} / {result.settings.fonts.body}</p>
        <button onClick={() => onImport(result.settings)}
          className="inline-flex items-center gap-1.5 px-4 py-2 bg-emerald-600 text-white text-sm font-medium rounded-xl hover:bg-emerald-700 transition-colors">
          <FileJson className="w-4 h-4" /> Appliquer les réglages
        </button>
      </div>

      {/* CSS */}
      {result.css && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setCssExpanded(!cssExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <Code className="w-4 h-4 text-gray-400" />
              CSS du thème ({(result.css.length / 1024).toFixed(0)} Ko)
            </div>
            <span className="text-xs text-gray-400">{cssExpanded ? "Réduire" : "Voir"}</span>
          </button>
          {cssExpanded && (
            <div className="px-4 pb-4">
              <pre className="text-xs text-gray-600 bg-gray-50 rounded-lg p-3 max-h-60 overflow-y-auto font-mono">
                {result.css.slice(0, 10000)}
                {result.css.length > 10000 && "\n\n..."}
              </pre>
              {onApplyCss && (
                <button
                  onClick={() => onApplyCss(result.css)}
                  className="mt-2 inline-flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 text-white text-xs font-medium rounded-lg hover:bg-gray-800 transition-colors"
                >
                  <Code className="w-3.5 h-3.5" /> Appliquer le CSS
                </button>
              )}
            </div>
          )}
        </div>
      )}

      {/* Assets */}
      {result.assets.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setAssetsExpanded(!assetsExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <ImageIcon className="w-4 h-4 text-gray-400" />
              Assets importés ({result.assets.length})
            </div>
            <span className="text-xs text-gray-400">{assetsExpanded ? "Réduire" : "Voir"}</span>
          </button>
          {assetsExpanded && (
            <div className="px-4 pb-4">
              <div className="grid grid-cols-4 sm:grid-cols-6 gap-2">
                {result.assets.map((asset) => (
                  <a key={asset.name} href={asset.url} target="_blank" rel="noopener"
                    className="group relative aspect-square bg-gray-50 rounded-lg overflow-hidden border border-gray-100"
                    title={asset.name}
                  >
                    {asset.name.match(/\.(png|jpg|jpeg|gif|webp|svg|ico)$/i) ? (
                      <img src={asset.url} alt={asset.name} className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center">
                        <FileText className="w-6 h-6 text-gray-300" />
                      </div>
                    )}
                    <div className="absolute inset-x-0 bottom-0 bg-gradient-to-t from-black/60 to-transparent p-1">
                      <p className="text-[9px] text-white truncate">{asset.name}</p>
                    </div>
                  </a>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Liquid templates */}
      {result.liquidFiles.length > 0 && (
        <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
          <button
            onClick={() => setLiquidExpanded(!liquidExpanded)}
            className="w-full flex items-center justify-between px-4 py-3 hover:bg-gray-50 transition-colors"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-gray-700">
              <FileText className="w-4 h-4 text-gray-400" />
              Templates Liquid ({result.liquidFiles.length})
            </div>
            <span className="text-xs text-gray-400">{liquidExpanded ? "Réduire" : "Voir"}</span>
          </button>
          {liquidExpanded && (
            <div className="px-4 pb-4 space-y-2">
              {result.liquidFiles.map((file, i) => (
                <details key={i} className="text-xs">
                  <summary className="cursor-pointer text-gray-600 hover:text-gray-900 font-medium">
                    {file.path}
                  </summary>
                  <pre className="mt-1 bg-gray-50 rounded-lg p-3 max-h-40 overflow-y-auto font-mono text-gray-600">
                    {file.content}
                  </pre>
                </details>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
