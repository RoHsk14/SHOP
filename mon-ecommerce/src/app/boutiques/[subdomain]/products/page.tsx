"use client";

import { useState, useEffect } from "react";
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
import { ShopProvider } from "@/lib/shop-context";

interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  images: string[] | null;
  stock_quantity: number | null;
  slug?: string;
}

const GRID_COLS: Record<number, string> = {
  2: "sm:grid-cols-2 lg:grid-cols-2",
  3: "sm:grid-cols-2 lg:grid-cols-3",
  4: "sm:grid-cols-2 lg:grid-cols-4",
};

export default function ProductsPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [shopName, setShopName] = useState("");

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      const [{ data: settings }, { data: productsData }] = await Promise.all([
        supabase.from("settings").select("theme_config, theme_id, shop_name").eq("shop_slug", subdomain).maybeSingle(),
        supabase.from("products").select("*").eq("shop_slug", subdomain).order("created_at", { ascending: false }),
      ]);

      if (cancelled) return;
      if (productsData) setProducts(productsData);
      if (settings) {
        setShopName(settings.shop_name || "");
        if (settings.theme_config && typeof settings.theme_config === "object" && (settings.theme_config as any).global?.colors) {
          setConfig(settings.theme_config as ThemeConfig);
        } else {
          setConfig(buildDefaultConfig(settings.theme_id || "classic"));
        }
      }
      setLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, [subdomain]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--theme-bg, #f9fafb)" }}>
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  const cssVars = config ? themeConfigToCSS(config) : {};
  const cols = config?.layout?.productsPerRow || 4;
  const gridClass = GRID_COLS[cols] || GRID_COLS[4];
  const sectionSharedProps = {
    social: config?.social,
    menus: config?.menus,
    brand: config?.brand,
  };

  return (
    <ShopProvider config={config || buildDefaultConfig("classic")} shopName={shopName} subdomain={subdomain}>
      <SearchModal />
      <CartDrawer />
      {config && (
        <>
          <GoogleFontsLoader fonts={{ heading: config.global.fonts.heading, body: config.global.fonts.body }} />
          <CustomCssInjector customCss={config.customCss} />
          <CookieBanner settings={config.cookie} />
        </>
      )}
      <div style={{ ...cssVars, background: cssVars["--theme-bg"] || "#f9fafb", minHeight: "100vh", fontSize: config ? `${config.global.fonts.baseSize}px` : undefined } as React.CSSProperties}>
        {config && sectionComponents.header && (() => {
          const headerSection = config.sections.find(s => s.type === "header" && !s.disabled);
          if (!headerSection) return null;
          const HeaderComp = sectionComponents.header;
          return <HeaderComp settings={headerSection.settings} shopName={shopName} {...sectionSharedProps} />;
        })()}

        <div className="mx-auto px-4 sm:px-6 py-8 sm:py-12" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
          <h1
            className="text-2xl sm:text-3xl font-bold mb-8"
            style={{
              color: "var(--theme-text)",
              fontFamily: "var(--theme-font-heading)",
            }}
          >
            Nos Produits
          </h1>

          {products.length === 0 ? (
            <div className="text-center py-20">
              <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                Aucun produit disponible pour le moment.
              </p>
            </div>
          ) : (
            <div className={`grid grid-cols-2 ${gridClass} gap-4 sm:gap-6`}>
              {products.map((product) => (
                <ProductCard key={product.id} product={product} subdomain={subdomain} />
              ))}
            </div>
          )}
        </div>

        {config && sectionComponents.footer && (() => {
          const footerSection = config.sections.find(s => s.type === "footer" && !s.disabled);
          if (!footerSection) return null;
          const FooterComp = sectionComponents.footer;
          return <FooterComp settings={footerSection.settings} blocks={footerSection.blocks} {...sectionSharedProps} />;
        })()}
      </div>
    </ShopProvider>
  );
}
