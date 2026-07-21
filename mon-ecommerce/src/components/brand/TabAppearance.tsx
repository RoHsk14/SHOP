"use client";

import { themes } from "@/lib/themes";
import type { Theme } from "@/lib/themes";
import ImagePicker from "@/components/ImagePicker";

interface Props {
  selectedThemeId: string;
  onThemeChange: (themeId: string) => void;
  logo: string;
  logoMaxWidth: number;
  favicon: string;
  onLogoChange: (url: string) => void;
  onLogoMaxWidthChange: (w: number) => void;
  onFaviconChange: (url: string) => void;
}

const themePreviewColors = (theme: Theme) => [
  theme.colors.primary,
  theme.colors.surface,
  theme.colors.text,
  theme.colors.background,
  theme.colors.accent,
];

export default function TabAppearance({
  selectedThemeId,
  onThemeChange,
  logo, logoMaxWidth,
  favicon,
  onLogoChange, onLogoMaxWidthChange, onFaviconChange,
}: Props) {
  return (
    <div className="space-y-8">
      {/* Theme presets */}
      <div>
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Thème visuel</h3>
        <p className="text-xs text-gray-400 mb-4">Choisissez un style prêt à l'emploi pour votre boutique</p>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {themes.map((theme) => (
            <button
              key={theme.id}
              onClick={() => onThemeChange(theme.id)}
              className={`relative p-4 rounded-xl border-2 text-left transition-all ${
                selectedThemeId === theme.id
                  ? "border-emerald-500 bg-emerald-50/50 shadow-sm"
                  : "border-gray-100 hover:border-gray-200 bg-white"
              }`}
            >
              {/* Color swatches */}
              <div className="flex gap-1 mb-2.5">
                {themePreviewColors(theme).map((color, i) => (
                  <span
                    key={i}
                    className="w-5 h-5 rounded-full border border-white/50 shadow-sm"
                    style={{ background: color }}
                  />
                ))}
              </div>
              <p className="text-sm font-medium text-gray-900">{theme.name}</p>
              <p className="text-xs text-gray-400 mt-0.5">{theme.description}</p>
              {selectedThemeId === theme.id && (
                <span className="absolute top-2 right-2 w-2.5 h-2.5 rounded-full bg-emerald-500" />
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Logo & Favicon */}
      <div className="border-t border-gray-100 pt-6">
        <h3 className="text-sm font-semibold text-gray-900 mb-1">Logo & Icône</h3>
        <p className="text-xs text-gray-400 mb-4">Téléchargez le logo et l'icône de votre boutique</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Logo de la boutique</label>
            <ImagePicker value={logo} onChange={onLogoChange} />
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-gray-400">Largeur max:</span>
              <input
                type="number"
                value={logoMaxWidth}
                onChange={(e) => onLogoMaxWidthChange(Number(e.target.value))}
                className="w-20 text-xs px-2 py-1 border border-gray-200 rounded-lg"
              />
              <span className="text-xs text-gray-400">px</span>
            </div>
            {logo && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center">
                <img src={logo} alt="Logo" style={{ maxWidth: logoMaxWidth, maxHeight: 60 }} className="object-contain" />
              </div>
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1.5">Icône (favicon)</label>
            <ImagePicker value={favicon} onChange={onFaviconChange} compact />
            {favicon && (
              <div className="mt-2 p-3 bg-gray-50 rounded-lg border border-gray-100 flex items-center justify-center w-16 h-16">
                <img src={favicon} alt="Favicon" className="w-8 h-8 object-contain" />
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
