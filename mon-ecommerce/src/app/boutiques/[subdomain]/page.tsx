"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { buildDefaultConfig, themeConfigToCSS, getPageSections, enforceFooterAtEnd, getPublishedConfig } from "@/lib/theme-config";
import type { ThemeConfig, SectionSetting } from "@/lib/theme-config";
import { sectionComponents } from "@/components/sections";
import { ShopProvider } from "@/lib/shop-context";
import GoogleFontsLoader from "@/components/GoogleFontsLoader";
import CustomCssInjector from "@/components/CustomCssInjector";
import ScriptInjector from "@/components/ScriptInjector";
import AnalyticsTracker from "@/components/AnalyticsTracker";
import SectionWrapper from "@/components/SectionWrapper";
import CookieBanner from "@/components/CookieBanner";
import SearchModal from "@/components/SearchModal";
import CartDrawer from "@/components/CartDrawer";
import BackToTop from "@/components/BackToTop";
import NewsletterPopup from "@/components/NewsletterPopup";
import { Eye } from "lucide-react";

function getPreviewParam(): boolean {
  if (typeof window === "undefined") return false;
  return new URLSearchParams(window.location.search).get("preview") === "1";
}

export default function StorefrontPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [previewThemeTitle, setPreviewThemeTitle] = useState<string | null>(null);
  const isPreview = getPreviewParam();
  const isEmbed = typeof window !== "undefined" && new URLSearchParams(window.location.search).get("embed") === "1";

  useEffect(() => {
    let cancelled = false;

    const fetchData = async () => {
      try {
        const { data: settings } = await supabase
          .from("settings")
          .select("theme_config, theme_id, shop_name")
          .eq("shop_slug", subdomain)
          .maybeSingle();

        if (cancelled) return;

        const previewThemeId = typeof window !== "undefined" ? new URLSearchParams(window.location.search).get("preview_theme_id") : null;

        if (settings) {
          setShopName(settings.shop_name || "");
          const rawConfig = settings.theme_config;
          const savedThemesList = rawConfig?.savedThemes || [];

          if (previewThemeId && savedThemesList.length > 0) {
            const targetTheme = savedThemesList.find((t: any) => t.id === previewThemeId);
            if (targetTheme?.config) {
              setConfig(targetTheme.config);
              setPreviewThemeTitle(targetTheme.name);
            } else if (rawConfig && typeof rawConfig === "object" && rawConfig.global?.colors) {
              setConfig(getPublishedConfig(rawConfig));
            } else {
              setConfig(buildDefaultConfig(settings.theme_id || "classic"));
            }
          } else if (rawConfig && typeof rawConfig === "object" && rawConfig.global?.colors) {
            if (isPreview && rawConfig.__draft) {
              setConfig(rawConfig.__draft as ThemeConfig);
            } else {
              setConfig(getPublishedConfig(rawConfig));
            }
          } else {
            setConfig(buildDefaultConfig(settings.theme_id || "classic"));
          }
        } else {
          setConfig(buildDefaultConfig("classic"));
        }
      } catch (e: any) {
        if (!cancelled) setError(e?.message || "Erreur de chargement");
      }
      if (!cancelled) setLoading(false);
    };
    fetchData();
    return () => { cancelled = true; };
  }, [subdomain, isPreview]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--theme-bg, #f9fafb)" }}>
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  if (error) return (
    <div className="min-h-screen flex items-center justify-center p-4" style={{ background: "var(--theme-bg, #f9fafb)" }}>
      <div className="text-center">
        <p className="text-red-600 text-sm mb-2">{error}</p>
        <a href="/" className="text-emerald-600 hover:underline text-sm">Recharger la page</a>
      </div>
    </div>
  );

  if (!config) return null;

  const cssVars = themeConfigToCSS(config);
  const pageSections = getPageSections(config, "/");
  const activeSections = enforceFooterAtEnd(pageSections.filter((s) => !s.disabled));

  const sectionSharedProps = {
    social: config.social,
    menus: config.menus,
    brand: config.brand,
  };

  return (
    <ShopProvider config={config} shopName={shopName} subdomain={subdomain}>
      <SearchModal />
      <CartDrawer />
      <GoogleFontsLoader fonts={{
        heading: config.global.fonts.heading,
        body: config.global.fonts.body,
      }} />
      <CustomCssInjector customCss={config.customCss} />
      <ScriptInjector scripts={config.scripts} />
      <AnalyticsTracker analytics={config.analytics} />
      {!isEmbed && <CookieBanner settings={config.cookie} />}
      {!isEmbed && <BackToTop settings={config.backToTop || { enabled: true, position: "right", backgroundColor: "#1f2937", iconColor: "#ffffff", borderRadius: "9999px" }} />}
      {!isEmbed && <NewsletterPopup settings={config.newsletterPopup || { enabled: false, title: "", content: "", image: "", delay: 10, exitIntent: true, backgroundColor: "#ffffff", textColor: "#111827", buttonBg: "#059669", buttonText: "#ffffff" }} />}

      {isEmbed && (
        <style dangerouslySetInnerHTML={{
          __html: `
            [data-nextjs-toast], nextjs-portal, [data-nextjs-dialog-overlay], div[data-nextjs-route-announcer] { display: none !important; }
            #__next-build-watcher, [data-next-badge], [data-nextjs-dev-tools-button] { display: none !important; }
            html, body { overflow-x: hidden !important; scrollbar-width: none !important; }
            ::-webkit-scrollbar { display: none !important; }
          `,
        }} />
      )}

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
        {isPreview && (
          <div className="bg-gray-900 text-white text-center text-xs py-2 px-4 flex items-center justify-center gap-2">
            <Eye className="w-3 h-3" />
            Aperçu — {shopName || subdomain}
          </div>
        )}

        {activeSections.map((section, idx) => {
          const Component = sectionComponents[section.type];
          if (!Component) return null;
          const visClass = [
            section.hideOnMobile ? "hidden sm:block" : "",
            section.hideOnDesktop ? "sm:hidden" : "",
          ].filter(Boolean).join(" ");
          return (
            <div key={`${section.id}-${idx}`} className={visClass || undefined}>
            <SectionWrapper settings={section.settings}>
            <Component
              key={`${section.id}-${idx}`}
              settings={section.settings}
              blocks={section.blocks}
              shopName={shopName}
              {...sectionSharedProps}
            />
            </SectionWrapper>
            </div>
          );
        })}

        {previewThemeTitle && !isEmbed && (
          <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-50 bg-gray-900/95 text-white px-5 py-3 rounded-full shadow-2xl flex items-center gap-4 text-xs font-medium border border-gray-700 backdrop-blur-md animate-in fade-in slide-in-from-bottom-3">
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-amber-400 animate-pulse" />
              <span>Aperçu en direct du thème : <strong className="text-amber-300">{previewThemeTitle}</strong> (Brouillon non publié)</span>
            </div>
            <div className="flex items-center gap-2">
              <a
                href={`/boutiques/${subdomain}/admin/themes`}
                className="px-3.5 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-white font-semibold transition-colors shadow-sm"
              >
                Gérer les thèmes
              </a>
            </div>
          </div>
        )}
      </div>
    </ShopProvider>
  );
}
