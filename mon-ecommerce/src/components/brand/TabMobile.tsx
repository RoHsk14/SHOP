"use client";

import type { LayoutSettings, FontSettings } from "@/lib/theme-config";

interface Props {
  layout: LayoutSettings;
  fonts: FontSettings;
  onLayoutChange: (layout: LayoutSettings) => void;
  onFontsChange: (fonts: FontSettings) => void;
}

export default function TabMobile({
  layout,
  fonts,
  onLayoutChange,
  onFontsChange,
}: Props) {
  return (
    <div className="space-y-5">
      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Affichage mobile</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Produits par ligne (mobile)</label>
            <select
              value={layout.mobileProductsPerRow || 2}
              onChange={(e) => onLayoutChange({ ...layout, mobileProductsPerRow: Number(e.target.value) as 1 | 2 })}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            >
              <option value={1}>1 produit</option>
              <option value={2}>2 produits</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Taille police mobile (px)</label>
            <input
              type="number"
              value={fonts.mobileBaseSize ?? fonts.baseSize}
              onChange={(e) => onFontsChange({ ...fonts, mobileBaseSize: Number(e.target.value) })}
              placeholder={String(fonts.baseSize)}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">Taille titres mobile</label>
            <select
              value={fonts.mobileHeadingSize || fonts.headingSize}
              onChange={(e) => onFontsChange({ ...fonts, mobileHeadingSize: e.target.value as "small" | "normal" | "large" })}
              className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
            >
              <option value="small">Petite</option>
              <option value="normal">Normale</option>
              <option value="large">Grande</option>
            </select>
          </div>
        </div>
      </div>

      <hr className="border-gray-100" />

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Visibilité conditionnelle</h3>
        <p className="text-xs text-gray-500 mb-3">
          Ces options contrôlent quand les sections s&apos;affichent. Configurez le comportement par section depuis l&apos;éditeur de pages.
        </p>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layout.showFilters !== false}
              onChange={(e) => onLayoutChange({ ...layout, showFilters: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Filtres en mobile</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layout.showSearch !== false}
              onChange={(e) => onLayoutChange({ ...layout, showSearch: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Recherche en mobile</span>
          </label>
        </div>
      </div>
    </div>
  );
}
