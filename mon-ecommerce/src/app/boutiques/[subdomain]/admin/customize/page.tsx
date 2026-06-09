"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themes } from "@/lib/themes";
import { buildDefaultConfig, themeConfigToCSS } from "@/lib/theme-config";
import type { ThemeConfig, NavMenu } from "@/lib/theme-config";
import SectionEditor from "@/components/SectionEditor";
import { sectionComponents } from "@/components/sections";
import { Save, Eye, Palette, Type, Layers, Image, Share2, Menu, LayoutDashboard, Code, Cookie, Upload } from "lucide-react";
import { toast } from "sonner";
import { worldCurrencies } from "@/lib/currencies";

import TabInfo from "@/components/brand/TabInfo";
import TabTheme from "@/components/brand/TabTheme";
import TabColors from "@/components/brand/TabColors";
import TabTypography from "@/components/brand/TabTypography";
import TabBackground from "@/components/brand/TabBackground";
import TabMedia from "@/components/brand/TabMedia";
import TabSocial from "@/components/brand/TabSocial";
import TabMenu from "@/components/brand/TabMenu";
import TabLayout from "@/components/brand/TabLayout";
import TabCustomCss from "@/components/brand/TabCustomCss";
import TabCookies from "@/components/brand/TabCookies";
import TabImport from "@/components/brand/TabImport";
import GoogleFontsLoader from "@/components/GoogleFontsLoader";

interface Tab {
  id: string;
  label: string;
  icon: React.ReactNode;
}

const TABS: Tab[] = [
  { id: "info", label: "Infos", icon: <Type className="w-4 h-4" /> },
  { id: "theme", label: "Thème", icon: <Palette className="w-4 h-4" /> },
  { id: "colors", label: "Couleurs", icon: <Palette className="w-4 h-4" /> },
  { id: "typography", label: "Typographie", icon: <Type className="w-4 h-4" /> },
  { id: "background", label: "Arrière-plan", icon: <Image className="w-4 h-4" /> },
  { id: "media", label: "Logo & Média", icon: <Image className="w-4 h-4" /> },
  { id: "social", label: "Réseaux", icon: <Share2 className="w-4 h-4" /> },
  { id: "menu", label: "Menu", icon: <Menu className="w-4 h-4" /> },
  { id: "layout", label: "Mise en page", icon: <LayoutDashboard className="w-4 h-4" /> },
  { id: "sections", label: "Sections", icon: <Layers className="w-4 h-4" /> },
  { id: "css", label: "CSS", icon: <Code className="w-4 h-4" /> },
  { id: "cookies", label: "Cookies", icon: <Cookie className="w-4 h-4" /> },
  { id: "import", label: "Import Shopify", icon: <Upload className="w-4 h-4" /> },
];

export default function CustomizePage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [activeTab, setActiveTab] = useState("theme");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSectionIndex, setSavingSectionIndex] = useState<number | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [shopCountry, setShopCountry] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [selectedThemeId, setSelectedThemeId] = useState("classic");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);

  const fetchSettings = useCallback(async () => {
    const { data, error } = await supabase
      .from("settings")
      .select("*")
      .eq("shop_slug", subdomain)
      .maybeSingle();
    if (!error && data) {
      setSettingsId(data.id);
      setShopName(data.shop_name || "");
      setShopDescription(data.shop_description || "");
      setOwnerName(data.owner_name || "");
      setShopCountry(data.shop_country || "");
      setDefaultCurrency(data.default_currency || "EUR");
      setSelectedThemeId(data.theme_id || "classic");
      if (data.theme_config && typeof data.theme_config === "object" && data.theme_config.global?.colors) {
        setThemeConfig(data.theme_config as ThemeConfig);
      }
    }
    setLoading(false);
  }, [subdomain]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const handleThemeChange = (themeId: string) => {
    setSelectedThemeId(themeId);
    setThemeConfig(buildDefaultConfig(themeId));
  };

  const selectedTheme = themes.find(t => t.id === selectedThemeId) || themes[0];
  const config = themeConfig || buildDefaultConfig(selectedThemeId);
  const cssVars = themeConfigToCSS(config);

  const updateConfig = (updater: (prev: ThemeConfig) => ThemeConfig) => {
    setThemeConfig((prev) => updater(prev || buildDefaultConfig(selectedThemeId)));
  };

  const handleSave = async () => {
    setSaving(true);
    const savedConfig = themeConfig || buildDefaultConfig(selectedThemeId);
    const updateData: Record<string, any> = {
      shop_name: shopName,
      shop_description: shopDescription,
      owner_name: ownerName,
      shop_country: shopCountry,
      default_currency: defaultCurrency,
      theme_id: selectedThemeId,
      theme_config: savedConfig,
      updated_at: new Date().toISOString(),
    };
    const brand = savedConfig.brand;
    if (brand?.logo && brand.logo.startsWith("data:")) updateData.logo_url = brand.logo;

    if (settingsId) {
      const { error } = await supabase.from("settings").update(updateData).eq("id", settingsId);
      if (error) { toast.error("Erreur : " + error.message); setSaving(false); return; }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from("settings").insert([{ ...updateData, shop_slug: subdomain, user_id: session?.user?.id }]);
      if (error) { toast.error("Erreur : " + error.message); setSaving(false); return; }
    }
    setSaving(false);
    toast.success("Boutique personnalisée !");
  };

  const handleSaveSection = async (index: number) => {
    setSavingSectionIndex(index);
    const savedConfig = themeConfig || buildDefaultConfig(selectedThemeId);
    const updateData: Record<string, any> = {
      theme_config: savedConfig,
      updated_at: new Date().toISOString(),
    };
    if (settingsId) {
      const { error } = await supabase.from("settings").update(updateData).eq("id", settingsId);
      if (error) { toast.error("Erreur : " + error.message); setSavingSectionIndex(null); return; }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from("settings").insert([{ ...updateData, shop_slug: subdomain, user_id: session?.user?.id }]);
      if (error) { toast.error("Erreur : " + error.message); setSavingSectionIndex(null); return; }
    }
    setSavingSectionIndex(null);
    toast.success("Section enregistrée !");
  };

  const openPreview = () => {
    const host = window.location.host;
    const protocol = window.location.protocol;
    let previewUrl = "";
    if (host.includes("localhost") || host.includes("lvh.me")) {
      const port = host.split(":")[1] ? `:${host.split(":")[1]}` : "";
      previewUrl = `${protocol}//${subdomain}.localhost${port}?preview=1`;
    } else {
      const parts = host.split(".");
      const apex = parts.length > 2 ? parts.slice(-2).join(".") : host;
      previewUrl = `${protocol}//${subdomain}.${apex}?preview=1`;
    }
    window.open(previewUrl, "_blank");
  };

  const handleShopifyImport = (settings: any) => {
    const newConfig = buildDefaultConfig(selectedThemeId);
    if (settings.colors) {
      const colorMap: Record<string, string> = {
        background: "background",
        text_color: "text",
        text_light_color: "textMuted",
        heading_color: "text",
        link_color: "link",
        button_background: "primary",
        button_text_color: "buttonText",
        header_background: "headerBg",
        header_heading_color: "headerText",
        footer_background: "footerBg",
        footer_text_color: "footerText",
        product_on_sale_color: "success",
      };
      for (const [shopifyKey, shopEazyKey] of Object.entries(colorMap)) {
        if (settings.colors[shopifyKey]) {
          (newConfig.global.colors as any)[shopEazyKey] = settings.colors[shopifyKey];
        }
      }
    }
    if (settings.fonts) {
      newConfig.global.fonts.heading = settings.fonts.heading;
      newConfig.global.fonts.body = settings.fonts.body;
    }
    if (settings.social) {
      newConfig.social = { ...newConfig.social, ...settings.social };
    }
    if (settings.layout?.productImageSize) newConfig.layout.productImageSize = settings.layout.productImageSize;
    if (settings.layout?.productInfoAlignment) newConfig.layout.productInfoAlignment = settings.layout.productInfoAlignment;
    if (settings.layout?.cartType) newConfig.layout.cartType = settings.layout.cartType;
    setThemeConfig(newConfig);
    setActiveTab("theme");
    toast.success("Thème Shopify appliqué !");
  };

  const tc = selectedTheme.colors;

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Personnaliser la boutique</h1>
          <p className="text-sm text-gray-500 mt-1">Tous les réglages pour votre marque</p>
        </div>
        <div className="flex items-center gap-3">
          <button
            onClick={openPreview}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-white border border-gray-200 rounded-xl text-sm font-medium text-gray-700 hover:bg-gray-50 transition-colors"
          >
            <Eye className="w-4 h-4" />
            Aperçu
          </button>
          <button
            onClick={handleSave} disabled={saving}
            className="inline-flex items-center gap-2 px-5 py-2.5 text-white font-semibold rounded-xl transition-colors disabled:opacity-50 text-sm shadow-sm"
            style={{ background: tc.primary }}
          >
            <Save className="w-4 h-4" />
            {saving ? "..." : "Publier"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex overflow-x-auto gap-1 pb-2 -mx-1 px-1 scrollbar-none">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          const isSections = tab.id === "sections";
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
                isActive
                  ? "bg-gray-900 text-white shadow-sm"
                  : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
              } ${isSections ? "border-l border-gray-200 ml-1" : ""}`}
            >
              {tab.icon}
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
        {activeTab === "info" && (
          <TabInfo
            shopName={shopName} setShopName={setShopName}
            shopDescription={shopDescription} setShopDescription={setShopDescription}
            ownerName={ownerName} setOwnerName={setOwnerName}
            shopCountry={shopCountry} setShopCountry={setShopCountry}
            defaultCurrency={defaultCurrency} setDefaultCurrency={setDefaultCurrency}
            worldCurrencies={worldCurrencies}
          />
        )}

        {activeTab === "theme" && (
          <div className="space-y-4">
            <TabTheme selectedThemeId={selectedThemeId} onThemeChange={handleThemeChange} />
            {/* Live preview */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden mt-4">
              <div className="p-4 border-b border-gray-100 flex items-center justify-between">
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedTheme.name} — <span className="text-gray-400 font-normal">Aperçu en direct</span>
                </h3>
              </div>
              <div className="max-h-[500px] overflow-y-auto" style={{ background: config.global.colors.background }}>
                <GoogleFontsLoader fonts={{ heading: config.global.fonts.heading, body: config.global.fonts.body }} />
                <div style={{
                  ...cssVars,
                  background: config.global.colors.background,
                  color: config.global.colors.text,
                  fontFamily: config.global.fonts.body,
                  fontSize: `${config.global.fonts.baseSize}px`,
                } as React.CSSProperties}>
                  {config.sections.filter(s => !s.disabled).map((section) => {
                    const Component = sectionComponents[section.type];
                    if (!Component) return null;
                    return <Component key={section.id} settings={section.settings} blocks={section.blocks} shopName={shopName} social={config.social} menus={config.menus} brand={config.brand} />;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "colors" && (
          <TabColors
            colors={config.global.colors}
            onChange={(colors) => updateConfig((prev) => ({
              ...prev,
              global: { ...prev.global, colors },
            }))}
          />
        )}

        {activeTab === "typography" && (
          <TabTypography
            fonts={config.global.fonts}
            onChange={(fonts) => updateConfig((prev) => ({
              ...prev,
              global: { ...prev.global, fonts },
            }))}
          />
        )}

        {activeTab === "background" && (
          <TabBackground
            background={config.background || { type: "color", color: config.global.colors.background }}
            onChange={(background) => updateConfig((prev) => ({ ...prev, background }))}
          />
        )}

        {activeTab === "media" && (
          <TabMedia
            brand={config.brand || { logo: "", logoMaxWidth: 140 }}
            onChange={(brand) => updateConfig((prev) => ({ ...prev, brand }))}
          />
        )}

        {activeTab === "social" && (
          <TabSocial
            social={config.social || {}}
            onChange={(social) => updateConfig((prev) => ({ ...prev, social }))}
          />
        )}

        {activeTab === "menu" && (
          <TabMenu
            menus={config.menus || []}
            onChange={(menus: NavMenu[]) => updateConfig((prev) => ({ ...prev, menus }))}
          />
        )}

        {activeTab === "layout" && (
          <TabLayout
            layout={config.layout}
            onChange={(layout) => updateConfig((prev) => ({ ...prev, layout }))}
          />
        )}

        {activeTab === "sections" && (
          <SectionEditor
            sections={config.sections}
            onChange={(sections) => updateConfig((prev) => ({ ...prev, sections }))}
            onSaveSection={handleSaveSection}
            savingSectionIndex={savingSectionIndex}
          />
        )}

        {activeTab === "css" && (
          <TabCustomCss
            customCss={config.customCss || { desktop: "", mobile: "" }}
            onChange={(customCss) => updateConfig((prev) => ({ ...prev, customCss }))}
          />
        )}

        {activeTab === "cookies" && (
          <TabCookies
            cookie={config.cookie || { enabled: false }}
            onChange={(cookie) => updateConfig((prev) => ({ ...prev, cookie }))}
          />
        )}

        {activeTab === "import" && (
          <TabImport onImport={handleShopifyImport} />
        )}
      </div>
    </div>
  );
}
