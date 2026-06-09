"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import type { ThemeConfig } from "@/lib/theme-config";
import { buildDefaultConfig, themeConfigToCSS } from "@/lib/theme-config";
import { sectionComponents } from "@/components/sections";
import ProductCard from "@/components/ProductCard";
import GoogleFontsLoader from "@/components/GoogleFontsLoader";
import CustomCssInjector from "@/components/CustomCssInjector";
import CookieBanner from "@/components/CookieBanner";
import SearchModal from "@/components/SearchModal";
import CartDrawer from "@/components/CartDrawer";
import BackToTop from "@/components/BackToTop";
import NewsletterPopup from "@/components/NewsletterPopup";
import Breadcrumbs from "@/components/Breadcrumbs";
import { ShopProvider, useShop } from "@/lib/shop-context";
import { Search, SlidersHorizontal, X } from "lucide-react";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  images: string[] | null;
  stock_quantity: number | null;
  slug?: string;
  created_at?: string;
  compareAtPrice?: number | null;
}

const GRID_COLS: Record<number, string> = {
  2: "sm:grid-cols-2 lg:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

function ProductFilters({
  query, setQuery,
  sortBy, setSortBy,
  priceMin, setPriceMin,
  priceMax, setPriceMax,
}: {
  query: string; setQuery: (v: string) => void;
  sortBy: string; setSortBy: (v: string) => void;
  priceMin: string; setPriceMin: (v: string) => void;
  priceMax: string; setPriceMax: (v: string) => void;
}) {
  const [open, setOpen] = useState(false);

  return (
    <div className="mb-6 space-y-3">
      <div className="flex items-center gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: "var(--theme-text-muted)" }} />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="w-full pl-9 pr-3 py-2.5 text-sm rounded-xl border"
            style={{
              background: "var(--theme-surface, #fff)",
              borderColor: "var(--theme-border, #e5e7eb)",
              color: "var(--theme-text)",
            }}
          />
        </div>
        <button
          onClick={() => setOpen(!open)}
          className="p-2.5 rounded-xl border"
          style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
        >
          <SlidersHorizontal className="w-4 h-4" style={{ color: open ? "var(--theme-primary)" : "var(--theme-text-muted)" }} />
        </button>
        <select
          value={sortBy}
          onChange={(e) => setSortBy(e.target.value)}
          className="px-3 py-2.5 text-sm rounded-xl border"
          style={{
            background: "var(--theme-surface, #fff)",
            borderColor: "var(--theme-border, #e5e7eb)",
            color: "var(--theme-text)",
          }}
        >
          <option value="newest">Plus récents</option>
          <option value="price-asc">Prix croissant</option>
          <option value="price-desc">Prix décroissant</option>
          <option value="name">Nom A-Z</option>
        </select>
      </div>

      {open && (
        <div className="flex items-center gap-3 p-3 rounded-xl border" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--theme-text-muted)" }}>
            Prix min :
            <input
              type="number"
              value={priceMin}
              onChange={(e) => setPriceMin(e.target.value)}
              placeholder="0"
              className="w-20 px-2 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
            />
          </div>
          <span style={{ color: "var(--theme-text-muted)" }}>—</span>
          <div className="flex items-center gap-2 text-xs" style={{ color: "var(--theme-text-muted)" }}>
            Prix max :
            <input
              type="number"
              value={priceMax}
              onChange={(e) => setPriceMax(e.target.value)}
              placeholder="99999"
              className="w-20 px-2 py-1.5 rounded-lg border text-xs"
              style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
            />
          </div>
          {(priceMin || priceMax) && (
            <button
              onClick={() => { setPriceMin(""); setPriceMax(""); }}
              className="p-1 hover:opacity-70"
            >
              <X className="w-3.5 h-3.5" style={{ color: "var(--theme-text-muted)" }} />
            </button>
          )}
        </div>
      )}
    </div>
  );
}

function ProductsContent() {
  const { config, shopName, subdomain } = useShop();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("shop_slug", subdomain)
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setProducts(data);
        setLoading(false);
      });
  }, [subdomain]);

  const filtered = useMemo(() => {
    let result = [...products];

    if (query) {
      const q = query.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }

    if (priceMin) {
      const min = parseFloat(priceMin);
      if (!isNaN(min)) result = result.filter((p) => (p.price || 0) >= min);
    }
    if (priceMax) {
      const max = parseFloat(priceMax);
      if (!isNaN(max)) result = result.filter((p) => (p.price || 0) <= max);
    }

    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return (a.price || 0) - (b.price || 0);
        case "price-desc": return (b.price || 0) - (a.price || 0);
        case "name": return a.name.localeCompare(b.name);
        default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });

    return result;
  }, [products, query, sortBy, priceMin, priceMax]);

  const cols = config?.layout?.productsPerRow || 4;
  const gridClass = GRID_COLS[cols] || GRID_COLS[4];
  const showFilters = config?.layout?.showFilters !== false;
  const showBadges = config?.layout?.showBadges !== false;
  const showWishlist = config?.layout?.showWishlist !== false;

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--theme-bg, #f9fafb)" }}>
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  return (
    <div style={{ minHeight: "100vh" }}>
      {config && sectionComponents.header && (() => {
        const h = config.sections.find(s => s.type === "header" && !s.disabled);
        if (!h) return null;
        const HC = sectionComponents.header;
        return <HC settings={h.settings} shopName={shopName} social={config.social} menus={config.menus} brand={config.brand} />;
      })()}

      <div className="mx-auto px-4 sm:px-6 py-6 sm:py-10" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        {config?.layout?.showBreadcrumbs !== false && (
          <Breadcrumbs items={[{ label: "Produits" }]} />
        )}

        <h1
          className="text-2xl sm:text-3xl font-bold mb-6"
          style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}
        >
          Nos Produits
        </h1>

        {showFilters && (
          <ProductFilters
            query={query} setQuery={setQuery}
            sortBy={sortBy} setSortBy={setSortBy}
            priceMin={priceMin} setPriceMin={setPriceMin}
            priceMax={priceMax} setPriceMax={setPriceMax}
          />
        )}

        {filtered.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
              {query || priceMin || priceMax ? "Aucun produit ne correspond à votre recherche." : "Aucun produit disponible pour le moment."}
            </p>
          </div>
        ) : (
          <div className={`grid grid-cols-2 ${gridClass} gap-4 sm:gap-6`}>
            {filtered.map((product) => (
              <ProductCard key={product.id} product={product} subdomain={subdomain} showBadges={showBadges} showWishlist={showWishlist} />
            ))}
          </div>
        )}
      </div>

      {config && sectionComponents.footer && (() => {
        const f = config.sections.find(s => s.type === "footer" && !s.disabled);
        if (!f) return null;
        const FC = sectionComponents.footer;
        return <FC settings={f.settings} blocks={f.blocks} social={config.social} />;
      })()}

      {config?.backToTop && <BackToTop settings={config.backToTop} />}
      {config?.newsletterPopup && <NewsletterPopup settings={config.newsletterPopup} />}
    </div>
  );
}

export default function ProductsPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [shopName, setShopName] = useState("");

  useEffect(() => {
    supabase
      .from("settings")
      .select("theme_config, theme_id, shop_name")
      .eq("shop_slug", subdomain)
      .maybeSingle()
      .then(({ data: settings }) => {
        if (settings) {
          setShopName(settings.shop_name || "");
          if (settings.theme_config && typeof settings.theme_config === "object" && (settings.theme_config as any).global?.colors) {
            setConfig(settings.theme_config as ThemeConfig);
          } else {
            setConfig(buildDefaultConfig(settings.theme_id || "classic"));
          }
        } else {
          setConfig(buildDefaultConfig("classic"));
        }
      });
  }, [subdomain]);

  const c = config || buildDefaultConfig("classic");
  const cssVars = themeConfigToCSS(c);

  return (
    <ShopProvider config={c} shopName={shopName} subdomain={subdomain}>
      <SearchModal />
      <CartDrawer />
      <GoogleFontsLoader fonts={{ heading: c.global.fonts.heading, body: c.global.fonts.body }} />
      <CustomCssInjector customCss={c.customCss} />
      <CookieBanner settings={c.cookie} />
      <div style={{ ...cssVars, background: cssVars["--theme-bg"] || "#f9fafb", fontSize: `${c.global.fonts.baseSize}px` } as React.CSSProperties}>
        <ProductsContent />
      </div>
    </ShopProvider>
  );
}
