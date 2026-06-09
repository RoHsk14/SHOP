"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { buildDefaultConfig, themeConfigToCSS } from "@/lib/theme-config";
import type { ThemeConfig } from "@/lib/theme-config";
import { sectionComponents } from "@/components/sections";
import ProductCard from "@/components/ProductCard";
import GoogleFontsLoader from "@/components/GoogleFontsLoader";
import CustomCssInjector from "@/components/CustomCssInjector";
import CookieBanner from "@/components/CookieBanner";
import SearchModal from "@/components/SearchModal";
import CartDrawer from "@/components/CartDrawer";
import BackToTop from "@/components/BackToTop";
import NewsletterPopup from "@/components/NewsletterPopup";
import HeadManager from "@/components/HeadManager";
import { ShopProvider, useShop } from "@/lib/shop-context";
import { Heart, ArrowLeft } from "lucide-react";

const WISHLIST_KEY = "shop-wishlist";

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  slug?: string;
}

function getWishlist(): WishlistItem[] {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
  } catch { return []; }
}

function WishlistContent() {
  const { config, shopName, subdomain } = useShop();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const update = () => setItems(getWishlist());
    update();
    window.addEventListener("wishlist-updated", update);
    return () => window.removeEventListener("wishlist-updated", update);
  }, []);

  return (
    <div style={{ minHeight: "100vh" }}>
      {config && sectionComponents.header && (() => {
        const h = config.sections.find(s => s.type === "header" && !s.disabled);
        if (!h) return null;
        const HC = sectionComponents.header;
        return <HC settings={h.settings} shopName={shopName} social={config.social} menus={config.menus} brand={config.brand} />;
      })()}

      <div className="mx-auto px-4 sm:px-6 py-6 sm:py-10" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        <div className="flex items-center gap-3 mb-6">
          <Heart className="w-6 h-6" style={{ color: "var(--theme-primary)" }} />
          <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}>
            Mes favoris
          </h1>
        </div>

        {items.length === 0 ? (
          <div className="text-center py-20">
            <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--theme-text-muted)" }} />
            <p className="text-sm mb-2" style={{ color: "var(--theme-text-muted)" }}>
              Vous n&apos;avez pas encore de favoris.
            </p>
            <a
              href={`/boutiques/${subdomain}/products`}
              className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-70"
              style={{ color: "var(--theme-primary)" }}
            >
              <ArrowLeft className="w-4 h-4" />
              Découvrir nos produits
            </a>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {items.map((item) => (
              <ProductCard
                key={item.id}
                product={{
                  id: item.id,
                  name: item.name,
                  price: item.price,
                  images: item.image ? [item.image] : [],
                  slug: item.slug,
                }}
                subdomain={subdomain}
                showBadges={false}
                showWishlist={true}
              />
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

export default function WishlistPage() {
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
      <HeadManager brand={c.brand} />
      <GoogleFontsLoader fonts={{ heading: c.global.fonts.heading, body: c.global.fonts.body }} />
      <CustomCssInjector customCss={c.customCss} />
      <CookieBanner settings={c.cookie} />
      <div style={{ ...cssVars, background: cssVars["--theme-bg"] || "#f9fafb", fontSize: `${c.global.fonts.baseSize}px` } as React.CSSProperties}>
        <WishlistContent />
      </div>
    </ShopProvider>
  );
}
