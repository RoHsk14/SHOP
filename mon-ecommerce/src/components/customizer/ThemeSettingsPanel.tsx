"use client";

import { useState } from "react";
import {
  Palette,
  Type,
  Sparkles,
  Layers,
  Share2,
  Bell,
  Smartphone,
  Check,
  ChevronDown,
  ChevronRight,
  ShieldCheck,
} from "lucide-react";
import { themes, Theme } from "@/lib/themes";
import type { ThemeConfig } from "@/lib/theme-config";
import ImagePicker from "@/components/ImagePicker";

interface ThemeSettingsPanelProps {
  config: ThemeConfig;
  shopName: string;
  onUpdateConfig: (updater: (prev: ThemeConfig) => ThemeConfig) => void;
  onUpdateShopName: (name: string) => void;
}

const GOOGLE_FONTS_PRESETS = [
  { name: "Inter (Moderne & Lisible)", value: "Inter, sans-serif" },
  { name: "Plus Jakarta Sans (Moderne Tech)", value: "'Plus Jakarta Sans', sans-serif" },
  { name: "Outfit (Élégant & Tendance)", value: "Outfit, sans-serif" },
  { name: "Playfair Display (Luxe & Raffiné)", value: "'Playfair Display', Georgia, serif" },
  { name: "Montserrat (Audacieux & Pro)", value: "Montserrat, sans-serif" },
  { name: "Poppins (Chaleureux & Accessible)", value: "Poppins, sans-serif" },
];

const COLOR_PALETTES = [
  {
    name: "Shopify Dawn (Émeraude)",
    primary: "#059669",
    bg: "#f9fafb",
    surface: "#ffffff",
    text: "#111827",
  },
  {
    name: "Noir Luxe & Haute Couture",
    primary: "#111827",
    bg: "#ffffff",
    surface: "#ffffff",
    text: "#111827",
  },
  {
    name: "Or & Prestige",
    primary: "#b8860b",
    bg: "#fefefe",
    surface: "#ffffff",
    text: "#1c1917",
  },
  {
    name: "Punchy Rouge (Flash)",
    primary: "#dc2626",
    bg: "#fafafa",
    surface: "#ffffff",
    text: "#171717",
  },
  {
    name: "Nature & Organique",
    primary: "#65a30d",
    bg: "#fafaf5",
    surface: "#ffffff",
    text: "#292524",
  },
  {
    name: "Violet Créatif & Tendance",
    primary: "#8b5cf6",
    bg: "#faf5ff",
    surface: "#ffffff",
    text: "#1f2937",
  },
];

export default function ThemeSettingsPanel({
  config,
  shopName,
  onUpdateConfig,
  onUpdateShopName,
}: ThemeSettingsPanelProps) {
  const [activeSection, setActiveSection] = useState<string>("presets");

  const toggleSection = (id: string) => {
    setActiveSection((prev) => (prev === id ? "" : id));
  };

  const applyThemePreset = (theme: Theme) => {
    onUpdateConfig((prev) => ({
      ...prev,
      global: {
        ...prev.global,
        colors: {
          ...prev.global.colors,
          primary: theme.colors.primary,
          primaryHover: theme.colors.primaryHover,
          secondary: theme.colors.secondary,
          background: theme.colors.background,
          surface: theme.colors.surface,
          text: theme.colors.text,
          textMuted: theme.colors.textMuted,
          border: theme.colors.border,
          accent: theme.colors.accent,
          headerBg: theme.colors.surface,
          headerText: theme.colors.text,
          footerBg: theme.colors.surface,
          footerText: theme.colors.textMuted,
        },
        fonts: {
          ...prev.global.fonts,
          heading: theme.fonts.heading,
          body: theme.fonts.body,
        },
        radii: {
          button: theme.radii.button,
          card: theme.radii.card,
          input: theme.radii.input,
        },
      },
    }));
  };

  const applyColorPalette = (palette: typeof COLOR_PALETTES[0]) => {
    onUpdateConfig((prev) => ({
      ...prev,
      global: {
        ...prev.global,
        colors: {
          ...prev.global.colors,
          primary: palette.primary,
          background: palette.bg,
          surface: palette.surface,
          text: palette.text,
        },
      },
    }));
  };

  return (
    <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-3.5 bg-white">
      {/* 1. Presets de thèmes en 1 clic */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection("presets")}
          className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">
                Thèmes pré-conçus en 1 clic
              </h3>
              <p className="text-[11px] text-gray-500">
                Changez l'ambiance complète instantanément
              </p>
            </div>
          </div>
          {activeSection === "presets" ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {activeSection === "presets" && (
          <div className="p-4 space-y-2.5 bg-white border-t border-gray-100">
            <p className="text-xs text-gray-500 mb-3">
              Sélectionnez un style pour appliquer automatiquement les couleurs, polices et arrondis assortis :
            </p>
            <div className="grid grid-cols-2 gap-2.5">
              {themes.map((theme) => {
                const isCurrent =
                  config.global.colors.primary.toLowerCase() ===
                  theme.colors.primary.toLowerCase();

                return (
                  <button
                    key={theme.id}
                    onClick={() => applyThemePreset(theme)}
                    className={`relative p-3 rounded-xl border text-left transition-all ${
                      isCurrent
                        ? "border-emerald-600 bg-emerald-50/40 ring-1 ring-emerald-500 shadow-xs"
                        : "border-gray-200 hover:border-gray-300 bg-white hover:bg-gray-50/50"
                    }`}
                  >
                    {isCurrent && (
                      <span className="absolute top-2.5 right-2.5 w-4 h-4 rounded-full bg-emerald-600 text-white flex items-center justify-center">
                        <Check className="w-2.5 h-2.5" />
                      </span>
                    )}
                    <div className="flex items-center gap-1.5 mb-2">
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: theme.colors.primary }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: theme.colors.background }}
                      />
                      <span
                        className="w-3.5 h-3.5 rounded-full border border-black/10 shrink-0"
                        style={{ backgroundColor: theme.colors.text }}
                      />
                    </div>
                    <h4 className="text-xs font-bold text-gray-900 truncate">
                      {theme.name}
                    </h4>
                    <p className="text-[10px] text-gray-500 line-clamp-1 mt-0.5">
                      {theme.description}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* 2. Couleurs du thème */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection("colors")}
          className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-100/80 text-blue-700 flex items-center justify-center">
              <Palette className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Couleurs du thème</h3>
              <p className="text-[11px] text-gray-500">
                Boutons, fond de page, textes et accents
              </p>
            </div>
          </div>
          {activeSection === "colors" ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {activeSection === "colors" && (
          <div className="p-4 space-y-4 bg-white border-t border-gray-100">
            {/* Quick Palettes */}
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Palettes recommandées
              </label>
              <div className="grid grid-cols-2 gap-2">
                {COLOR_PALETTES.map((p) => (
                  <button
                    key={p.name}
                    onClick={() => applyColorPalette(p)}
                    className="flex items-center gap-2 p-2 rounded-xl border border-gray-200 hover:border-gray-300 text-left transition-all"
                  >
                    <span
                      className="w-4 h-4 rounded-full border border-black/10 shrink-0"
                      style={{ backgroundColor: p.primary }}
                    />
                    <span className="text-[11px] font-medium text-gray-800 truncate">
                      {p.name.split(" ")[0]}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {/* Individual Pickers */}
            <div className="space-y-3 pt-2 border-t border-gray-100">
              {[
                { label: "Couleur principale (boutons, liens)", key: "primary" as const },
                { label: "Arrière-plan de la boutique", key: "background" as const },
                { label: "Surfaces et cartes produits", key: "surface" as const },
                { label: "Texte principal", key: "text" as const },
                { label: "Texte secondaire / atténué", key: "textMuted" as const },
                { label: "En-tête (Navigation)", key: "headerBg" as const },
                { label: "Pied de page (Footer)", key: "footerBg" as const },
              ].map(({ label, key }) => (
                <div key={key} className="flex items-center justify-between gap-3">
                  <span className="text-xs text-gray-700 font-medium">{label}</span>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={config.global.colors[key] || "#000000"}
                      onChange={(e) =>
                        onUpdateConfig((prev) => ({
                          ...prev,
                          global: {
                            ...prev.global,
                            colors: {
                              ...prev.global.colors,
                              [key]: e.target.value,
                            },
                          },
                        }))
                      }
                      className="w-8 h-8 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white shadow-xs"
                    />
                    <span className="text-[11px] font-mono text-gray-500 uppercase w-16">
                      {config.global.colors[key]}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* 3. Typographie & Polices */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection("fonts")}
          className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-purple-100/80 text-purple-700 flex items-center justify-center">
              <Type className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Typographie</h3>
              <p className="text-[11px] text-gray-500">
                Polices de titres et corps de texte
              </p>
            </div>
          </div>
          {activeSection === "fonts" ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {activeSection === "fonts" && (
          <div className="p-4 space-y-4 bg-white border-t border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Police des titres
              </label>
              <select
                value={config.global.fonts.heading}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    global: {
                      ...prev.global,
                      fonts: {
                        ...prev.global.fonts,
                        heading: e.target.value,
                      },
                    },
                  }))
                }
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {GOOGLE_FONTS_PRESETS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Police du texte courant
              </label>
              <select
                value={config.global.fonts.body}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    global: {
                      ...prev.global,
                      fonts: {
                        ...prev.global.fonts,
                        body: e.target.value,
                      },
                    },
                  }))
                }
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              >
                {GOOGLE_FONTS_PRESETS.map((f) => (
                  <option key={f.value} value={f.value}>
                    {f.name}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Taille de base du texte
                </label>
                <span className="text-xs font-semibold text-gray-500">
                  {config.global.fonts.baseSize || 15}px
                </span>
              </div>
              <input
                type="range"
                min={13}
                max={18}
                value={config.global.fonts.baseSize || 15}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    global: {
                      ...prev.global,
                      fonts: {
                        ...prev.global.fonts,
                        baseSize: Number(e.target.value),
                      },
                    },
                  }))
                }
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Identité de marque & Logo */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection("brand")}
          className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-amber-100/80 text-amber-700 flex items-center justify-center">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Identité & Logo</h3>
              <p className="text-[11px] text-gray-500">
                Nom, logo de la boutique et favicon
              </p>
            </div>
          </div>
          {activeSection === "brand" ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {activeSection === "brand" && (
          <div className="p-4 space-y-4 bg-white border-t border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Nom de la boutique
              </label>
              <input
                type="text"
                value={shopName}
                onChange={(e) => onUpdateShopName(e.target.value)}
                placeholder="Ex: Ma Super Boutique"
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1.5">
                Logo de la boutique
              </label>
              <ImagePicker
                value={config.brand?.logo || ""}
                onChange={(url) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, logo: url },
                  }))
                }
              />
            </div>

            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="text-xs font-bold text-gray-700">
                  Largeur maximale du logo
                </label>
                <span className="text-xs font-semibold text-gray-500">
                  {config.brand?.logoMaxWidth || 140}px
                </span>
              </div>
              <input
                type="range"
                min={60}
                max={250}
                value={config.brand?.logoMaxWidth || 140}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    brand: { ...prev.brand, logoMaxWidth: Number(e.target.value) },
                  }))
                }
                className="w-full accent-emerald-600"
              />
            </div>
          </div>
        )}
      </div>

      {/* 5. Style des Boutons & Arrondis */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection("shapes")}
          className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-teal-100/80 text-teal-700 flex items-center justify-center">
              <Layers className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Boutons & Cartes</h3>
              <p className="text-[11px] text-gray-500">
                Formes des boutons et styles des cartes
              </p>
            </div>
          </div>
          {activeSection === "shapes" ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {activeSection === "shapes" && (
          <div className="p-4 space-y-4 bg-white border-t border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Forme des boutons
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "9999px", label: "Arrondi (Pill)" },
                  { id: "12px", label: "Doux (12px)" },
                  { id: "4px", label: "Carré (4px)" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() =>
                      onUpdateConfig((prev) => ({
                        ...prev,
                        global: {
                          ...prev.global,
                          radii: { ...prev.global.radii, button: id },
                        },
                      }))
                    }
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                      config.global.radii.button === id
                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2">
                Coins des cartes produits
              </label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "24px", label: "Très arrondi" },
                  { id: "16px", label: "Modéré (16px)" },
                  { id: "8px", label: "Discret (8px)" },
                ].map(({ id, label }) => (
                  <button
                    key={id}
                    onClick={() =>
                      onUpdateConfig((prev) => ({
                        ...prev,
                        global: {
                          ...prev.global,
                          radii: { ...prev.global.radii, card: id },
                        },
                      }))
                    }
                    className={`py-2 px-2 text-xs font-semibold rounded-xl border transition-all ${
                      config.global.radii.card === id
                        ? "bg-gray-900 text-white border-gray-900 shadow-sm"
                        : "bg-white text-gray-600 border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 6. Réseaux Sociaux & WhatsApp */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection("social")}
          className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-emerald-100/80 text-emerald-700 flex items-center justify-center">
              <Share2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Réseaux & WhatsApp</h3>
              <p className="text-[11px] text-gray-500">
                Canaux de contact et profils sociaux
              </p>
            </div>
          </div>
          {activeSection === "social" ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {activeSection === "social" && (
          <div className="p-4 space-y-3 bg-white border-t border-gray-100">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                WhatsApp (Numéro avec indicatif)
              </label>
              <input
                type="text"
                value={config.social?.whatsapp || ""}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    social: { ...prev.social, whatsapp: e.target.value },
                  }))
                }
                placeholder="Ex: 229XXXXXXXX"
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Lien Instagram
              </label>
              <input
                type="url"
                value={config.social?.instagram || ""}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    social: { ...prev.social, instagram: e.target.value },
                  }))
                }
                placeholder="https://instagram.com/..."
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">
                Lien TikTok
              </label>
              <input
                type="url"
                value={config.social?.tiktok || ""}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    social: { ...prev.social, tiktok: e.target.value },
                  }))
                }
                placeholder="https://tiktok.com/@..."
                className="w-full text-xs px-3 py-2 bg-white border border-gray-200 rounded-xl text-gray-800 focus:outline-none focus:ring-2 focus:ring-emerald-500"
              />
            </div>
          </div>
        )}
      </div>

      {/* 7. Popups & Réassurance */}
      <div className="border border-gray-200 rounded-2xl overflow-hidden shadow-xs">
        <button
          onClick={() => toggleSection("popups")}
          className="w-full flex items-center justify-between p-4 bg-gray-50/70 hover:bg-gray-100/70 transition-colors text-left"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-orange-100/80 text-orange-700 flex items-center justify-center">
              <Bell className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-xs font-bold text-gray-900">Bannières & Popups</h3>
              <p className="text-[11px] text-gray-500">
                Cookies, popup newsletter et retour en haut
              </p>
            </div>
          </div>
          {activeSection === "popups" ? (
            <ChevronDown className="w-4 h-4 text-gray-400" />
          ) : (
            <ChevronRight className="w-4 h-4 text-gray-400" />
          )}
        </button>

        {activeSection === "popups" && (
          <div className="p-4 space-y-3 bg-white border-t border-gray-100">
            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
              <span className="text-xs font-medium text-gray-800">
                Bouton &quot;Retour en haut&quot; flottant
              </span>
              <input
                type="checkbox"
                checked={config.backToTop?.enabled !== false}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    backToTop: {
                      enabled: e.target.checked,
                      position: "right",
                      backgroundColor: "#1f2937",
                      iconColor: "#ffffff",
                      borderRadius: "9999px",
                    },
                  }))
                }
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>

            <label className="flex items-center justify-between p-3 bg-gray-50 rounded-xl cursor-pointer">
              <span className="text-xs font-medium text-gray-800">
                Bannière d&apos;acceptation des cookies
              </span>
              <input
                type="checkbox"
                checked={!!config.cookie?.enabled}
                onChange={(e) =>
                  onUpdateConfig((prev) => ({
                    ...prev,
                    cookie: {
                      enabled: e.target.checked,
                      message: "Ce site utilise des cookies pour améliorer votre expérience.",
                      buttonText: "Accepter",
                      declineText: "Refuser",
                      position: "bottom",
                    },
                  }))
                }
                className="w-4 h-4 rounded text-emerald-600 focus:ring-emerald-500"
              />
            </label>
          </div>
        )}
      </div>
    </div>
  );
}
