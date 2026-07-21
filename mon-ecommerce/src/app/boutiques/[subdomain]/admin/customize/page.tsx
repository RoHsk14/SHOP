"use client";

import { useState, useEffect, useCallback, useRef, useMemo } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themes } from "@/lib/themes";
import { buildDefaultConfig, themeConfigToCSS, getPageSections, enforceFooterAtEnd, getPublishedConfig, getDraftConfig, publishDraft } from "@/lib/theme-config";
import type { ThemeConfig, NavMenu, SavedTheme } from "@/lib/theme-config";
import PuckPageEditor from "@/components/SectionEditor.puck";
import { sectionComponents } from "@/components/sections";
import { Save, Eye, Palette, Type, Share2, Menu, Settings, Layers, Download, FileUp, ArrowLeft, BarChart3, Smartphone } from "lucide-react";
import { toast } from "sonner";
import { worldCurrencies } from "@/lib/currencies";

import TabInfo from "@/components/brand/TabInfo";
import TabAppearance from "@/components/brand/TabAppearance";
import TabSocial from "@/components/brand/TabSocial";
import TabMenu from "@/components/brand/TabMenu";
import TabSettings from "@/components/brand/TabSettings";
import TabAnalytics from "@/components/brand/TabAnalytics";
import TabMobile from "@/components/brand/TabMobile";

const TABS = [
  { id: "general", label: "Général", icon: <Type className="w-4 h-4" /> },
  { id: "appearance", label: "Apparence", icon: <Palette className="w-4 h-4" /> },
  { id: "menu", label: "Menu", icon: <Menu className="w-4 h-4" /> },
  { id: "social", label: "Réseaux", icon: <Share2 className="w-4 h-4" /> },
  { id: "pages", label: "Pages", icon: <Layers className="w-4 h-4" /> },
  { id: "settings", label: "Réglages", icon: <Settings className="w-4 h-4" /> },
  { id: "analytics", label: "Analytics", icon: <BarChart3 className="w-4 h-4" /> },
  { id: "mobile", label: "Mobile", icon: <Smartphone className="w-4 h-4" /> },
];

export default function CustomizePage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [activeTab, setActiveTab] = useState("appearance");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [shopCountry, setShopCountry] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [selectedThemeId, setSelectedThemeId] = useState("classic");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);
  const [lastPublished, setLastPublished] = useState<ThemeConfig | null>(null);
  const [savedThemes, setSavedThemes] = useState<SavedTheme[]>([]);
  const [saveStatus, setSaveStatus] = useState<"saved" | "unsaved" | "saving">("saved");
  const autoSaveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const saveToDbRef = useRef<(savedConfig: ThemeConfig, isPublish: boolean, themes?: SavedTheme[]) => Promise<boolean>>(async () => false);
  const lastSaveRef = useRef<number>(0);

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
        const published = getPublishedConfig(data.theme_config);
        const draft = getDraftConfig(data.theme_config, published);
        setLastPublished(published);
        setThemeConfig(draft);
        if (data.theme_config.savedThemes) {
          setSavedThemes(data.theme_config.savedThemes);
        }
      } else if (data.theme_config?.__draft) {
        setLastPublished(buildDefaultConfig(data.theme_id || "classic"));
        setThemeConfig(data.theme_config.__draft as ThemeConfig);
        if (data.theme_config.savedThemes) {
          setSavedThemes(data.theme_config.savedThemes);
        }
      }
    }
    setLoading(false);
  }, [subdomain]);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  useEffect(() => {
    if (!themeConfig || !settingsId) return;
    setSaveStatus("unsaved");
    if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    autoSaveTimer.current = setTimeout(async () => {
      const now = Date.now();
      if (now - lastSaveRef.current < 3000) return;
      lastSaveRef.current = now;
      setSaveStatus("saving");
      try {
        const ok = await saveToDbRef.current(themeConfig, false);
        if (ok) setSaveStatus("saved");
        else setSaveStatus("unsaved");
      } catch {
        setSaveStatus("unsaved");
      }
    }, 3000);
    return () => {
      if (autoSaveTimer.current) clearTimeout(autoSaveTimer.current);
    };
  }, [themeConfig, settingsId, saveToDbRef]);

  const handleThemeChange = (themeId: string) => {
    setSelectedThemeId(themeId);
    setThemeConfig(buildDefaultConfig(themeId));
  };

  const selectedTheme = themes.find(t => t.id === selectedThemeId) || themes[0];
  const config = useMemo(() => themeConfig || buildDefaultConfig(selectedThemeId), [themeConfig, selectedThemeId]);
  const cssVars = useMemo(() => themeConfigToCSS(config), [config]);

  const updateConfig = useCallback((updater: (prev: ThemeConfig) => ThemeConfig) => {
    setThemeConfig((prev) => updater(prev || buildDefaultConfig(selectedThemeId)));
  }, [selectedThemeId]);

  const [publishing, setPublishing] = useState(false);
  const [fullscreenEditor, setFullscreenEditor] = useState(false);

  const saveToDb = async (savedConfig: ThemeConfig, isPublish: boolean, themes?: SavedTheme[]) => {
    setSaving(true);
    const st = themes ?? savedThemes;
    let configToSave: any;
    if (isPublish) {
      configToSave = { ...publishDraft(savedConfig) };
      setLastPublished(savedConfig);
    } else {
      const published = lastPublished || savedConfig;
      configToSave = { ...published, __draft: { ...savedConfig } };
    }
    if (st.length > 0) {
      configToSave.savedThemes = st;
    }
    const updateData: Record<string, any> = {
      shop_name: shopName,
      shop_description: shopDescription,
      owner_name: ownerName,
      shop_country: shopCountry,
      default_currency: defaultCurrency,
      theme_id: selectedThemeId,
      theme_config: configToSave,
      updated_at: new Date().toISOString(),
    };
    const brand = savedConfig.brand;
    if (brand?.logo && brand.logo.startsWith("data:")) updateData.logo_url = brand.logo;

    if (settingsId) {
      const { error } = await supabase.from("settings").update(updateData).eq("id", settingsId);
      if (error) { toast.error("Erreur : " + error.message); setSaving(false); return false; }
    } else {
      const { data: { session } } = await supabase.auth.getSession();
      const { error } = await supabase.from("settings").insert([{ ...updateData, shop_slug: subdomain, user_id: session?.user?.id }]);
      if (error) { toast.error("Erreur : " + error.message); setSaving(false); return false; }
    }
    setSaving(false);
    return true;
  };

  saveToDbRef.current = saveToDb;

  const handleSave = async () => {
    const savedConfig = themeConfig || buildDefaultConfig(selectedThemeId);
    const ok = await saveToDb(savedConfig, false);
    if (ok) toast.success("Brouillon enregistré !");
  };

  const handlePublish = async () => {
    if (!window.confirm("Publier la boutique ? Cela remplacera la version en ligne actuelle.")) return;
    setPublishing(true);
    const savedConfig = themeConfig || buildDefaultConfig(selectedThemeId);
    const ok = await saveToDb(savedConfig, true);
    if (ok) toast.success("Boutique publiée !");
    setPublishing(false);
  };

  const handleExport = () => {
    const exportConfig = themeConfig || buildDefaultConfig(selectedThemeId);
    const clean = publishDraft(exportConfig);
    const blob = new Blob([JSON.stringify(clean, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `theme-${subdomain}-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Thème exporté !");
  };

  const importFileRef = useRef<HTMLInputElement>(null);

  const handleImportFile = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const imported = JSON.parse(text);
      if (!imported.global || !imported.sections) {
        toast.error("Fichier de thème invalide");
        return;
      }
      const clean = publishDraft(imported);
      setThemeConfig(clean);
      const name = file.name.replace(/\.json$/i, "");
      const newTheme: SavedTheme = {
        id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        name,
        config: clean,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      const updated = [...savedThemes, newTheme];
      setSavedThemes(updated);
      saveToDb(clean, false, updated);
      toast.success(`Thème "${name}" importé !`);
    } catch {
      toast.error("Erreur de lecture du fichier JSON");
    }
    e.target.value = "";
  };

  const openPreview = async () => {
    const savedConfig = themeConfig || buildDefaultConfig(selectedThemeId);
    const ok = await saveToDb(savedConfig, false);
    if (!ok) return;
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

  const tc = selectedTheme.colors;

  const previewSections = useMemo(
    () => enforceFooterAtEnd(getPageSections(config, "/").filter(s => !s.disabled)),
    [config]
  );

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (fullscreenEditor) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        {/* Top bar */}
        <div className="flex items-center justify-between px-2 h-8 border-b bg-gray-50 shrink-0">
          <button
            onClick={() => setFullscreenEditor(false)}
            className="inline-flex items-center gap-0.5 px-1.5 py-0 text-[10px] font-medium text-gray-600 hover:bg-gray-200 rounded transition-colors"
          >
            <ArrowLeft className="w-3 h-3" />
            Quitter
          </button>
          <div className="flex items-center gap-1">
            <span className="text-[10px] font-semibold text-gray-900">{shopName}</span>
            <span className="text-[9px] text-gray-300">—</span>
            <span className="text-[10px] text-gray-500">Éditeur de pages</span>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleSave}
              disabled={saving}
              className="inline-flex items-center gap-0.5 px-1.5 py-0 text-[10px] font-medium text-gray-600 hover:bg-gray-100 rounded transition-colors disabled:opacity-50"
            >
              <Save className="w-3 h-3" />
              {saving ? "..." : "Brouillon"}
            </button>
            <button
              onClick={handlePublish}
              disabled={publishing}
              className="inline-flex items-center gap-0.5 px-2 py-0 text-[10px] font-semibold text-white rounded transition-colors disabled:opacity-50 shadow-sm"
              style={{ background: tc.primary }}
            >
              <Save className="w-3 h-3" />
              {publishing ? "..." : "Publier"}
            </button>
          </div>
        </div>
        {/* Puck editor */}
        <div className="flex-1 min-h-0 overflow-hidden">
          <PuckPageEditor
            pagesProp={config.pages || []}
            defaultSections={config.sections}
            onChange={(pages, sections) => updateConfig((prev) => ({ ...prev, pages, sections }))}
            brand={config.brand}
            shopName={shopName}
            social={config.social}
            menus={config.menus}
            cssVars={cssVars}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Personnaliser la boutique{" "}
            {saveStatus === "unsaved" && <span className="inline-flex items-center gap-1 text-xs font-normal text-amber-500 align-middle"><span className="w-1.5 h-1.5 rounded-full bg-amber-400" />Modifié</span>}
            {saveStatus === "saving" && <span className="inline-flex items-center gap-1 text-xs font-normal text-blue-500 align-middle"><span className="w-2 h-2 rounded-full border-2 border-blue-400 border-t-transparent animate-spin" />Sauvegarde...</span>}
          </h1>
          <p className="text-sm text-gray-500 mt-1">{"Créez l'apparence de votre boutique en quelques clics"}</p>
        </div>
        <div className="flex items-center gap-2">
          <input ref={importFileRef} type="file" accept=".json" onChange={handleImportFile} className="hidden" />
          <button onClick={() => importFileRef.current?.click()} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Importer un thème">
            <FileUp className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={handleExport} className="p-2 hover:bg-gray-100 rounded-lg transition-colors" title="Exporter le thème">
            <Download className="w-4 h-4 text-gray-400" />
          </button>
          <button onClick={openPreview} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors">
            <Eye className="w-4 h-4" />
            Aperçu
          </button>
          <button onClick={handleSave} disabled={saving} className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-600 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50">
            <Save className="w-4 h-4" />
            {saving ? "..." : "Brouillon"}
          </button>
          <button onClick={handlePublish} disabled={publishing} className="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-semibold text-white rounded-lg transition-colors disabled:opacity-50 shadow-sm" style={{ background: tc.primary }}>
            <Save className="w-4 h-4" />
            {publishing ? "..." : "Publier"}
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 pb-1 overflow-x-auto">
        {TABS.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`inline-flex items-center gap-1.5 px-3.5 py-2 text-xs font-medium rounded-xl whitespace-nowrap transition-all ${
              activeTab === tab.id
                ? "bg-gray-900 text-white shadow-sm"
                : "text-gray-500 hover:text-gray-800 hover:bg-gray-100"
            }`}
          >
            {tab.icon}
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab content */}
      <div className="bg-white rounded-2xl border border-gray-200 p-5 sm:p-6">
        {activeTab === "general" && (
          <TabInfo
            shopName={shopName} setShopName={setShopName}
            shopDescription={shopDescription} setShopDescription={setShopDescription}
            ownerName={ownerName} setOwnerName={setOwnerName}
            shopCountry={shopCountry} setShopCountry={setShopCountry}
            defaultCurrency={defaultCurrency} setDefaultCurrency={setDefaultCurrency}
            worldCurrencies={worldCurrencies}
          />
        )}

        {activeTab === "appearance" && (
          <div className="space-y-6">
            <TabAppearance
              selectedThemeId={selectedThemeId}
              onThemeChange={handleThemeChange}
              logo={config.brand?.logo || ""}
              logoMaxWidth={config.brand?.logoMaxWidth || 140}
              favicon={config.brand?.favicon || ""}
              onLogoChange={(url) => updateConfig((prev) => ({ ...prev, brand: { ...prev.brand, logo: url } }))}
              onLogoMaxWidthChange={(w) => updateConfig((prev) => ({ ...prev, brand: { ...prev.brand, logoMaxWidth: w } }))}
              onFaviconChange={(url) => updateConfig((prev) => ({ ...prev, brand: { ...prev.brand, favicon: url } }))}
            />
            {/* Live preview of the theme */}
            <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="text-sm font-semibold text-gray-900">
                  {selectedTheme.name} — <span className="text-gray-400 font-normal">Aperçu</span>
                </h3>
              </div>
              <div className="max-h-[400px] overflow-y-auto" style={{ background: config.global.colors.background }}>
                <div style={{
                  ...cssVars,
                  background: config.global.colors.background,
                  color: config.global.colors.text,
                  fontFamily: config.global.fonts.body,
                  fontSize: `${config.global.fonts.baseSize}px`,
                } as React.CSSProperties}>
                  {previewSections.map((section, idx) => {
                    const Component = sectionComponents[section.type];
                    if (!Component) return null;
                    return <Component key={`${section.id}-${idx}`} settings={section.settings} blocks={section.blocks} shopName={shopName} social={config.social} menus={config.menus} brand={config.brand} />;
                  })}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "menu" && (
          <TabMenu
            menus={config.menus || []}
            onChange={(menus: NavMenu[]) => updateConfig((prev) => ({ ...prev, menus }))}
          />
        )}

        {activeTab === "social" && (
          <TabSocial
            social={config.social || {}}
            onChange={(social) => updateConfig((prev) => ({ ...prev, social }))}
          />
        )}

        {activeTab === "pages" && (
          <PuckPageEditor
            pagesProp={config.pages || []}
            defaultSections={config.sections}
            onChange={(pages, sections) => updateConfig((prev) => ({ ...prev, pages, sections }))}
            brand={config.brand}
            shopName={shopName}
            social={config.social}
            menus={config.menus}
            onFullscreen={() => setFullscreenEditor(true)}
          />
        )}

        {activeTab === "settings" && (
          <TabSettings
            layout={config.layout}
            backToTop={config.backToTop || { enabled: true, position: "right", backgroundColor: "#1f2937", iconColor: "#ffffff", borderRadius: "9999px" }}
            newsletterPopup={config.newsletterPopup || { enabled: false, title: "Restez informé", content: "", image: "", delay: 10, exitIntent: true, backgroundColor: "#ffffff", textColor: "#111827", buttonBg: "#059669", buttonText: "#ffffff" }}
            cookie={config.cookie || { enabled: false, message: "Ce site utilise des cookies pour améliorer votre expérience.", buttonText: "Accepter", declineText: "Refuser", position: "bottom", background: "#1f2937", textColor: "#ffffff", buttonBg: "#059669", buttonTextColor: "#ffffff" }}
            onLayoutChange={(layout) => updateConfig((prev) => ({ ...prev, layout }))}
            onBackToTopChange={(backToTop) => updateConfig((prev) => ({ ...prev, backToTop }))}
            onNewsletterChange={(newsletterPopup) => updateConfig((prev) => ({ ...prev, newsletterPopup }))}
            onCookieChange={(cookie) => updateConfig((prev) => ({ ...prev, cookie }))}
          />
        )}

        {activeTab === "analytics" && (
          <TabAnalytics
            analytics={config.analytics || {}}
            scripts={config.scripts || {}}
            onAnalyticsChange={(analytics) => updateConfig((prev) => ({ ...prev, analytics }))}
            onScriptsChange={(scripts) => updateConfig((prev) => ({ ...prev, scripts }))}
          />
        )}

        {activeTab === "mobile" && (
          <TabMobile
            layout={config.layout}
            fonts={config.global.fonts}
            onLayoutChange={(layout) => updateConfig((prev) => ({ ...prev, layout }))}
            onFontsChange={(fonts) => updateConfig((prev) => ({ ...prev, global: { ...prev.global, fonts } }))}
          />
        )}
      </div>
    </div>
  );
}
