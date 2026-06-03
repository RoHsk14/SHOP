"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { themes, type Theme } from "@/lib/themes";
import { buildDefaultConfig, themeConfigToCSS } from "@/lib/theme-config";
import type { ThemeConfig } from "@/lib/theme-config";
import SectionEditor from "@/components/SectionEditor";
import { sectionComponents } from "@/components/sections";
import { Save, Eye, Check } from "lucide-react";
import ImagePicker from "@/components/ImagePicker";
import { toast } from "sonner";
import { worldCurrencies } from "@/lib/currencies";

const COUNTRIES = [
  "France", "Belgique", "Suisse", "Canada", "Luxembourg",
  "Maroc", "Algérie", "Tunisie", "Sénégal", "Côte d'Ivoire",
];

function ThemeCard({ theme, active, onSelect }: { theme: Theme; active: boolean; onSelect: () => void }) {
  const c = theme.colors;
  return (
    <button
      onClick={onSelect}
      className={`relative text-left w-full rounded-2xl border-2 overflow-hidden transition-all hover:shadow-lg ${
        active ? "border-emerald-500 shadow-md" : "border-gray-200 hover:border-gray-300"
      }`}
    >
      <div className="p-4 space-y-3" style={{ background: c.background }}>
        <div className="flex items-center gap-2">
          <div className="w-6 h-6 rounded-lg flex items-center justify-center text-[10px] font-bold text-white" style={{ background: c.primary }}>
            S
          </div>
          <div className="h-2 w-16 rounded-full" style={{ background: c.text, opacity: 0.3 }} />
          <div className="ml-auto flex gap-1">
            <div className="w-4 h-2 rounded-full" style={{ background: c.textMuted, opacity: 0.3 }} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2">
          {[1, 2].map(i => (
            <div key={i} className="rounded-xl p-2 space-y-1.5" style={{
              background: c.surface,
              boxShadow: theme.cardStyle === "shadow" ? "0 1px 3px rgba(0,0,0,0.08)" : "none",
              border: theme.cardStyle === "bordered" ? `1px solid ${c.border}` : "none",
            }}>
              <div className={`w-full rounded-lg ${theme.productImageShape === "square" ? "aspect-square" : theme.productImageShape === "portrait" ? "aspect-[3/4]" : "aspect-[4/3]"} flex items-center justify-center`} style={{ background: c.secondary }}>
                <div className="w-6 h-6 rounded" style={{ background: c.border }} />
              </div>
              <div className="h-2 w-3/4 rounded-full" style={{ background: c.text, opacity: 0.2 }} />
              <div className="h-2 w-1/2 rounded-full" style={{ background: c.primary, opacity: 0.6 }} />
            </div>
          ))}
        </div>
      </div>
      <div className="p-3 flex items-center justify-between" style={{ background: c.surface }}>
        <div>
          <p className="text-sm font-semibold" style={{ color: c.text }}>{theme.name}</p>
          <p className="text-xs mt-0.5" style={{ color: c.textMuted }}>{theme.description}</p>
        </div>
        {active && (
          <div className="w-6 h-6 rounded-full bg-emerald-500 flex items-center justify-center">
            <Check className="w-3.5 h-3.5 text-white" />
          </div>
        )}
      </div>
    </button>
  );
}

export default function CustomizePage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savingSectionIndex, setSavingSectionIndex] = useState<number | null>(null);
  const [settingsId, setSettingsId] = useState<string | null>(null);

  const [shopName, setShopName] = useState("");
  const [shopDescription, setShopDescription] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [shopCountry, setShopCountry] = useState("");
  const [defaultCurrency, setDefaultCurrency] = useState("EUR");
  const [logo, setLogo] = useState<string | null>(null);
  const [selectedThemeId, setSelectedThemeId] = useState("classic");
  const [themeConfig, setThemeConfig] = useState<ThemeConfig | null>(null);

  useEffect(() => {
    const fetchSettings = async () => {
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
        setLogo(data.logo_url || null);
        if (data.theme_config && typeof data.theme_config === "object" && data.theme_config.global?.colors) {
          setThemeConfig(data.theme_config as ThemeConfig);
        }
      }
      setLoading(false);
    };
    fetchSettings();
  }, [subdomain]);

  const handleThemeChange = (themeId: string) => {
    setSelectedThemeId(themeId);
    setThemeConfig(buildDefaultConfig(themeId));
  };

  const selectedTheme = themes.find(t => t.id === selectedThemeId) || themes[0];
  const config = themeConfig || buildDefaultConfig(selectedThemeId);
  const cssVars = themeConfigToCSS(config);

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
    if (logo && logo.startsWith("data:")) updateData.logo_url = logo;

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

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  const tc = selectedTheme.colors;

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold text-gray-900">Personnaliser la boutique</h1>
          <p className="text-sm text-gray-500 mt-1">Choisissez un thème et composez votre page</p>
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

      {/* Informations générales */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <h2 className="text-sm font-semibold text-gray-900">Informations générales</h2>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom de la boutique</label>
          <input type="text" value={shopName} onChange={e => setShopName(e.target.value)}
            placeholder="Ma Boutique"
            className="w-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-colors rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Description</label>
          <textarea value={shopDescription} onChange={e => setShopDescription(e.target.value)}
            placeholder="Décrivez votre boutique..." rows={3}
            className="w-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-colors resize-none rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Nom du propriétaire</label>
            <input type="text" value={ownerName} onChange={e => setOwnerName(e.target.value)}
              placeholder="Votre nom"
              className="w-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-colors rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Pays</label>
            <select value={shopCountry} onChange={e => setShopCountry(e.target.value)}
              className="w-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-colors bg-white rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
            >
              <option value="">Sélectionner</option>
              {COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Devise par défaut</label>
          <select value={defaultCurrency} onChange={e => setDefaultCurrency(e.target.value)}
            className="w-full border border-gray-200 px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 transition-colors bg-white rounded-lg focus:ring-emerald-500 focus:border-emerald-500"
          >
            {worldCurrencies.map(c => <option key={c.code} value={c.code}>{c.code} — {c.name} ({c.symbol})</option>)}
          </select>
        </div>
      </div>

      {/* Theme browser */}
      <div>
        <h2 className="text-sm font-semibold text-gray-900 mb-3">Thèmes</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-3 gap-4">
          {themes.map(theme => (
            <ThemeCard
              key={theme.id}
              theme={theme}
              active={selectedThemeId === theme.id}
              onSelect={() => handleThemeChange(theme.id)}
            />
          ))}
        </div>
      </div>

      {/* Live preview */}
      <div className="bg-white rounded-2xl border border-gray-200 overflow-hidden">
        <div className="p-4 border-b border-gray-100 flex items-center justify-between">
          <h3 className="text-sm font-semibold text-gray-900">
            {selectedTheme.name} — <span className="text-gray-400 font-normal">Aperçu en direct</span>
          </h3>
          <div className="text-xs text-gray-400">{selectedThemeId}</div>
        </div>
        <div className="max-h-[600px] overflow-y-auto" style={{ background: config.global.colors.background }}>
          <div style={{
            ...cssVars,
            background: config.global.colors.background,
            color: config.global.colors.text,
            fontFamily: config.global.fonts.body,
          } as React.CSSProperties}>
            {config.sections.filter(s => !s.disabled).map((section) => {
              const Component = sectionComponents[section.type];
              if (!Component) return null;
              return (
                <Component
                  key={section.id}
                  settings={section.settings}
                  blocks={section.blocks}
                  shopName={shopName}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Section editor */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <SectionEditor
          sections={config.sections}
          onChange={(sections) => setThemeConfig(prev => {
            const base = prev || buildDefaultConfig(selectedThemeId);
            return { ...base, sections };
          })}
          onSaveSection={handleSaveSection}
          savingSectionIndex={savingSectionIndex}
        />
      </div>

      {/* Colors */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Couleurs globales</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-4">
          {Object.entries(config.global.colors).map(([key, val]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">
                {key.replace(/([A-Z])/g, ' $1').trim()}
              </label>
              <input
                type="color"
                value={val}
                onChange={(e) => setThemeConfig({
                  ...config,
                  global: {
                    ...config.global,
                    colors: { ...config.global.colors, [key]: e.target.value },
                  },
                })}
                className="w-full h-9 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
              />
            </div>
          ))}
        </div>
      </div>

      {/* Radii */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Rayons de bordure</h2>
        <div className="grid grid-cols-3 gap-4">
          {Object.entries(config.global.radii).map(([key, val]) => (
            <div key={key}>
              <label className="block text-xs font-medium text-gray-500 mb-1 capitalize">{key}</label>
              <select
                value={val}
                onChange={(e) => setThemeConfig({
                  ...config,
                  global: {
                    ...config.global,
                    radii: { ...config.global.radii, [key]: e.target.value },
                  },
                })}
                className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
              >
                <option value="0px">Aucun</option>
                <option value="4px">Petit</option>
                <option value="8px">Moyen</option>
                <option value="12px">Arrondi</option>
                <option value="16px">Très arrondi</option>
                <option value="24px">Pilule</option>
                <option value="9999px">Complètement rond</option>
              </select>
            </div>
          ))}
        </div>
      </div>

      {/* Logo */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6">
        <h2 className="text-sm font-semibold text-gray-900 mb-4">Logo de la boutique</h2>
        <ImagePicker value={logo || ""} onChange={setLogo} />
      </div>

    </div>
  );
}
