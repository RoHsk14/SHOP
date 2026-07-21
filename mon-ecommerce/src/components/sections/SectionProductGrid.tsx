"use client";

import { useShop } from "@/lib/shop-context";
import { useProductGrid } from "@/lib/product-grid-context";
import ProductCard from "@/components/ProductCard";

const GRID_COLS: Record<number, string> = {
  2: "grid-cols-2 lg:grid-cols-2",
  3: "grid-cols-2 lg:grid-cols-3",
  4: "grid-cols-2 lg:grid-cols-4",
};

const MOBILE_COLS: Record<number, string> = {
  1: "grid-cols-1",
  2: "grid-cols-2",
};

export default function SectionProductGrid() {
  const { config, subdomain } = useShop();
  const { filtered = [], loading } = useProductGrid();

  const showBadges = config?.layout?.showBadges !== false;
  const showWishlist = config?.layout?.showWishlist !== false;
  const cols = config?.layout?.productsPerRow || 4;
  const mobileCols = config?.layout?.mobileProductsPerRow || 2;
  const isList = config?.layout?.collectionLayout === "list";
  const gridClass = GRID_COLS[cols] || GRID_COLS[4];
  const mobileClass = MOBILE_COLS[mobileCols] || MOBILE_COLS[2];

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="mx-auto px-4 sm:px-6 pb-6 sm:pb-10" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
      {filtered.length === 0 ? (
        <div className="text-center py-20">
          <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
            Aucun produit disponible pour le moment.
          </p>
        </div>
      ) : isList ? (
        <div className="flex flex-col gap-4">
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} subdomain={subdomain} showBadges={showBadges} showWishlist={showWishlist} />
          ))}
        </div>
      ) : (
        <div className={`grid ${mobileClass} ${gridClass} gap-4 sm:gap-6`}>
          {filtered.map((product) => (
            <ProductCard key={product.id} product={product} subdomain={subdomain} showBadges={showBadges} showWishlist={showWishlist} />
          ))}
        </div>
      )}
    </div>
  );
}
