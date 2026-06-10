"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { buildDefaultConfig, themeConfigToCSS, getPageSections, ensureSystemPageInConfig, enforceFooterAtEnd } from "@/lib/theme-config";
import type { ThemeConfig } from "@/lib/theme-config";
import { sectionComponents } from "@/components/sections";
import GoogleFontsLoader from "@/components/GoogleFontsLoader";
import CustomCssInjector from "@/components/CustomCssInjector";
import CookieBanner from "@/components/CookieBanner";
import SearchModal from "@/components/SearchModal";
import CartDrawer from "@/components/CartDrawer";
import BackToTop from "@/components/BackToTop";
import NewsletterPopup from "@/components/NewsletterPopup";
import HeadManager from "@/components/HeadManager";
import { ShopProvider } from "@/lib/shop-context";

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
            let c = settings.theme_config as ThemeConfig;
            c = ensureSystemPageInConfig(c, "/wishlist");
            setConfig(c);
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
  const activeSections = enforceFooterAtEnd(getPageSections(c, "/wishlist").filter((s) => !s.disabled));

  return (
    <ShopProvider config={c} shopName={shopName} subdomain={subdomain}>
      <SearchModal />
      <CartDrawer />
      <HeadManager brand={c.brand} />
      <GoogleFontsLoader fonts={{ heading: c.global.fonts.heading, body: c.global.fonts.body }} />
      <CustomCssInjector customCss={c.customCss} />
      <CookieBanner settings={c.cookie} />
      <BackToTop settings={c.backToTop || { enabled: true, position: "right", backgroundColor: "#1f2937", iconColor: "#ffffff", borderRadius: "9999px" }} />
      <NewsletterPopup settings={c.newsletterPopup || { enabled: false, title: "", content: "", image: "", delay: 10, exitIntent: true, backgroundColor: "#ffffff", textColor: "#111827", buttonBg: "#059669", buttonText: "#ffffff" }} />
      <div style={{ ...cssVars, background: cssVars["--theme-bg"] || "#f9fafb", minHeight: "100vh", fontSize: `${c.global.fonts.baseSize}px` } as React.CSSProperties}>
        {activeSections.map((section) => {
          const Component = sectionComponents[section.type];
          if (!Component) return null;
          return (
            <Component
              key={section.id}
              settings={section.settings}
              blocks={section.blocks}
              shopName={shopName}
              social={c.social}
              menus={c.menus}
              brand={c.brand}
            />
          );
        })}
      </div>
    </ShopProvider>
  );
}
