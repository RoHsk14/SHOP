"use client";

import type { BrandAssets } from "@/lib/theme-config";
import ImagePicker from "@/components/ImagePicker";

export default function TabMedia({
  brand,
  onChange,
}: {
  brand: BrandAssets;
  onChange: (brand: BrandAssets) => void;
}) {
  return (
    <div className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Logo de la boutique</label>
        <ImagePicker value={brand.logo || ""} onChange={(v) => onChange({ ...brand, logo: v })} />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Largeur max du logo (px)</label>
        <input
          type="number"
          value={brand.logoMaxWidth || 140}
          onChange={(e) => onChange({ ...brand, logoMaxWidth: Number(e.target.value) })}
          min={40}
          max={400}
          className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
        />
      </div>

      <hr className="border-gray-100" />

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Favicon (icône onglet)</label>
        <ImagePicker value={brand.favicon || ""} onChange={(v) => onChange({ ...brand, favicon: v })} compact />
        <p className="text-xs text-gray-400 mt-1">32x32px, format .ico ou .png recommandé</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Image de partage (OG)</label>
        <ImagePicker value={brand.ogImage || ""} onChange={(v) => onChange({ ...brand, ogImage: v })} />
        <p className="text-xs text-gray-400 mt-1">Utilisée quand on partage la boutique sur les réseaux sociaux. 1200x630px recommandé.</p>
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1.5">Couleur de thème (barre navigateur mobile)</label>
        <div className="flex items-center gap-2">
          <input
            type="color"
            value={brand.themeColor || "#059669"}
            onChange={(e) => onChange({ ...brand, themeColor: e.target.value })}
            className="w-10 h-10 p-0.5 border border-gray-200 rounded-lg cursor-pointer bg-white"
          />
          <input
            type="text"
            value={brand.themeColor || ""}
            onChange={(e) => onChange({ ...brand, themeColor: e.target.value })}
            className="flex-1 text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900 font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
          />
        </div>
      </div>
    </div>
  );
}
