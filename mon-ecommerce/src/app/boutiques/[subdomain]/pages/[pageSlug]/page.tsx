"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { buildDefaultConfig, themeConfigToCSS, getPageSections, enforceFooterAtEnd } from "@/lib/theme-config";
import type { ThemeConfig, SectionSetting } from "@/lib/theme-config";
import { sectionComponents } from "@/components/sections";
import { ShopProvider } from "@/lib/shop-context";
import GoogleFontsLoader from "@/components/GoogleFontsLoader";
import CustomCssInjector from "@/components/CustomCssInjector";
import CookieBanner from "@/components/CookieBanner";
import SearchModal from "@/components/SearchModal";
import CartDrawer from "@/components/CartDrawer";
import BackToTop from "@/components/BackToTop";
import NewsletterPopup from "@/components/NewsletterPopup";
import HeadManager from "@/components/HeadManager";

export default function CustomPage() {
  const { subdomain, pageSlug } = useParams<{ subdomain: string; pageSlug: string }>();
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    const fetchData = async () => {
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

  if (!config) return null;

  const cssVars = themeConfigToCSS(config);
  const pageSlugClean = pageSlug.startsWith("/") ? pageSlug : `/${pageSlug}`;
  const pageSections = getPageSections(config, pageSlugClean);
  const activeSections = enforceFooterAtEnd(pageSections.filter((s) => !s.disabled));

  const sectionSharedProps = {
    social: config.social,
    menus: config.menus,
    brand: config.brand,
  };

  return (
    <ShopProvider config={config} shopName={shopName} subdomain={subdomain}>
      <HeadManager brand={config.brand} />
      <SearchModal />
      <CartDrawer />
      <GoogleFontsLoader fonts={{ heading: config.global.fonts.heading, body: config.global.fonts.body }} />
      <CustomCssInjector customCss={config.customCss} />
      <CookieBanner settings={config.cookie} />
      <BackToTop settings={config.backToTop || { enabled: true, position: "right", backgroundColor: "#1f2937", iconColor: "#ffffff", borderRadius: "9999px" }} />
      <NewsletterPopup settings={config.newsletterPopup || { enabled: false, title: "", content: "", image: "", delay: 10, exitIntent: true, backgroundColor: "#ffffff", textColor: "#111827", buttonBg: "#059669", buttonText: "#ffffff" }} />

      <div
        style={{
          ...cssVars,
          background: cssVars["--theme-bg"],
          color: cssVars["--theme-text"],
          fontFamily: cssVars["--theme-font-body"],
          fontSize: `${config.global.fonts.baseSize}px`,
          minHeight: "100vh",
        } as React.CSSProperties}
      >
        {activeSections.length === 0 && (
          <div className="min-h-[60vh] flex items-center justify-center">
            <div className="text-center">
              <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>
                Cette page est vide. Configurez ses sections dans l&apos;administration.
              </p>
            </div>
          </div>
        )}

        {activeSections.map((section) => {
          const Component = sectionComponents[section.type];
          if (!Component) return null;
          return (
            <Component
              key={section.id}
              settings={section.settings}
              blocks={section.blocks}
              shopName={shopName}
              {...sectionSharedProps}
            />
          );
        })}
      </div>
    </ShopProvider>
  );
}
