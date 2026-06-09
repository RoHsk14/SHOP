"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slug";
import { buildDefaultConfig, themeConfigToCSS } from "@/lib/theme-config";
import type { ThemeConfig } from "@/lib/theme-config";
import { sectionComponents } from "@/components/sections";
import ProductDetail from "@/components/products/ProductDetail";
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
}

export default function ProductPage() {
  const params = useParams();
  const slug = params.slug as string;
  const subdomain = params.subdomain as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;

    const fetchProduct = async () => {
      const { data: settings } = await supabase
        .from("settings")
        .select("theme_config, theme_id, shop_name")
        .eq("shop_slug", subdomain)
        .maybeSingle();

      if (cancelled) return;

      if (settings) {
        setShopName(settings.shop_name || "");
        if (settings.theme_config && typeof settings.theme_config === "object" && (settings.theme_config as any).global?.colors) {
          setConfig(settings.theme_config as ThemeConfig);
        } else {
          setConfig(buildDefaultConfig(settings.theme_id || "classic"));
        }
      }

      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("shop_slug", subdomain)
        .maybeSingle();

      if (data) {
        if (!cancelled) setProduct(data);
      } else {
        const { data: all } = await supabase
          .from("products")
          .select("*")
          .eq("shop_slug", subdomain);

        if (cancelled) return;

        const found = all?.find((p) => slugify(p.name) === slug);
        if (found) {
          setProduct(found);
        } else {
          setNotFound(true);
        }
      }
      setLoading(false);
    };
    fetchProduct();
    return () => { cancelled = true; };
  }, [slug, subdomain]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--theme-bg, #f9fafb)" }}>
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (notFound || !product) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--theme-bg, #f9fafb)" }}>
        <div className="text-center">
          <h1 className="text-xl font-bold mb-2" style={{ color: "var(--theme-text, #111827)" }}>Produit introuvable</h1>
          <a href={`/boutiques/${subdomain}/products`} style={{ color: "var(--theme-primary, #059669)" }} className="text-sm hover:underline">
            Voir tous les produits
          </a>
        </div>
      </div>
    );
  }

  const cssVars = config ? themeConfigToCSS(config) : {};
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
          <GoogleFontsLoader fonts={{
            heading: config.global.fonts.heading,
            body: config.global.fonts.body,
          }} />
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

        <ProductDetail product={product} />

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
