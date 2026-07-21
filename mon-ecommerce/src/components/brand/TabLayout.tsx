"use client";

import type { LayoutSettings } from "@/lib/theme-config";

export default function TabLayout({
  layout,
  onChange,
}: {
  layout: LayoutSettings;
  onChange: (layout: LayoutSettings) => void;
}) {
  return (
    <div className="space-y-5">
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Largeur max du conteneur (px)</label>
          <select
            value={layout.containerWidth || 1200}
            onChange={(e) => onChange({ ...layout, containerWidth: Number(e.target.value) })}
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
          >
            <option value={960}>960px — Étroit</option>
            <option value={1100}>1100px — Standard</option>
            <option value={1200}>1200px — Large</option>
            <option value={1320}>1320px — Très large</option>
            <option value={1400}>1400px — Extra large</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Espacement des sections</label>
          <select
            value={layout.sectionSpacing || "normal"}
            onChange={(e) => onChange({ ...layout, sectionSpacing: e.target.value as LayoutSettings["sectionSpacing"] })}
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
          >
            <option value="compact">Compact</option>
            <option value="normal">Normal</option>
            <option value="spacious">Espacé</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Taille des images produits</label>
          <select
            value={layout.productImageSize}
            onChange={(e) => onChange({ ...layout, productImageSize: e.target.value as LayoutSettings["productImageSize"] })}
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
          >
            <option value="natural">Naturelle</option>
            <option value="square">Carré (1:1)</option>
            <option value="tall">Portrait (2:3)</option>
            <option value="wide">Paysage (4:3)</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Produits par ligne</label>
          <select
            value={layout.productsPerRow || 3}
            onChange={(e) => onChange({ ...layout, productsPerRow: Number(e.target.value) as 2 | 3 | 4 })}
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
          >
            <option value={2}>2 produits</option>
            <option value={3}>3 produits</option>
            <option value={4}>4 produits</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Produits par ligne (mobile)</label>
          <select
            value={layout.mobileProductsPerRow || 2}
            onChange={(e) => onChange({ ...layout, mobileProductsPerRow: Number(e.target.value) as 1 | 2 })}
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
          >
            <option value={1}>1 produit</option>
            <option value={2}>2 produits</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Style de collection</label>
          <select
            value={layout.collectionLayout || "grid"}
            onChange={(e) => onChange({ ...layout, collectionLayout: e.target.value as "grid" | "list" })}
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
          >
            <option value="grid">Grille</option>
            <option value="list">Liste</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Style du header</label>
          <select
            value={layout.headerStyle || "standard"}
            onChange={(e) => onChange({ ...layout, headerStyle: e.target.value as LayoutSettings["headerStyle"] })}
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
          >
            <option value="standard">Standard</option>
            <option value="transparent">Transparent</option>
            <option value="centered">Centré</option>
            <option value="minimal">Minimal</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Colonnes du footer</label>
          <select
            value={layout.footerColumns || 3}
            onChange={(e) => onChange({ ...layout, footerColumns: Number(e.target.value) as 1 | 2 | 3 | 4 })}
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
          >
            <option value={1}>1 colonne</option>
            <option value={2}>2 colonnes</option>
            <option value={3}>3 colonnes</option>
            <option value={4}>4 colonnes</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Alignement des infos produits</label>
          <select
            value={layout.productInfoAlignment || "left"}
            onChange={(e) => onChange({ ...layout, productInfoAlignment: e.target.value as "left" | "center" })}
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
          >
            <option value="left">Gauche</option>
            <option value="center">Centré</option>
          </select>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Type de panier</label>
          <select
            value={layout.cartType || "drawer"}
            onChange={(e) => onChange({ ...layout, cartType: e.target.value as "drawer" | "page" })}
            className="w-full text-sm px-3 py-2 bg-white border border-gray-200 rounded-lg text-gray-900"
          >
            <option value="drawer">Tiroir latéral</option>
            <option value="page">Page dédiée</option>
          </select>
        </div>
      </div>

      <hr className="border-gray-100" />

      <div>
        <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">Visibilité globale</h3>
        <div className="flex flex-wrap gap-6">
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layout.showSearch !== false}
              onChange={(e) => onChange({ ...layout, showSearch: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Recherche</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layout.showCart !== false}
              onChange={(e) => onChange({ ...layout, showCart: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Panier</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layout.showBreadcrumbs !== false}
              onChange={(e) => onChange({ ...layout, showBreadcrumbs: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Fil d'Ariane</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layout.showFilters !== false}
              onChange={(e) => onChange({ ...layout, showFilters: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Filtres produits</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layout.showWishlist !== false}
              onChange={(e) => onChange({ ...layout, showWishlist: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Wishlist (❤️)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layout.showBadges !== false}
              onChange={(e) => onChange({ ...layout, showBadges: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Badges (Nouveau, Promo)</span>
          </label>
          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={layout.stickyHeader !== false}
              onChange={(e) => onChange({ ...layout, stickyHeader: e.target.checked })}
              className="w-4 h-4 rounded border-gray-300 text-emerald-600 focus:ring-emerald-500"
            />
            <span className="text-sm text-gray-700">Header sticky</span>
          </label>
        </div>
      </div>
    </div>
  );
}
