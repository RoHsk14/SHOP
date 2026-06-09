"use client";

import { useState, useEffect } from "react";
import { useParams, useSearchParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { buildDefaultConfig, themeConfigToCSS } from "@/lib/theme-config";
import type { ThemeConfig } from "@/lib/theme-config";
import { sectionComponents } from "@/components/sections";
import GoogleFontsLoader from "@/components/GoogleFontsLoader";
import CustomCssInjector from "@/components/CustomCssInjector";
import CookieBanner from "@/components/CookieBanner";
import SearchModal from "@/components/SearchModal";
import CartDrawer from "@/components/CartDrawer";
import BackToTop from "@/components/BackToTop";
import NewsletterPopup from "@/components/NewsletterPopup";
import { ShopProvider } from "@/lib/shop-context";
import { CheckCircle } from "lucide-react";

export default function ThankYouPage() {
  const { subdomain } = useParams<{ subdomain: string }>();
  const searchParams = useSearchParams();
  const [config, setConfig] = useState<ThemeConfig | null>(null);
  const [shopName, setShopName] = useState("");
  const [loading, setLoading] = useState(true);

  const price = searchParams.get("price");
  const currency = searchParams.get("currency") || "EUR";
  const product = searchParams.get("product");
  const qty = searchParams.get("qty");

  useEffect(() => {
    const fetchSettings = async () => {
      const { data: settings } = await supabase
        .from("settings")
        .select("theme_config, theme_id, shop_name")
        .eq("shop_slug", subdomain)
        .maybeSingle();

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
      setLoading(false);
    };
    fetchSettings();
  }, [subdomain]);

  if (loading) return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: "var(--theme-bg, #f9fafb)" }}>
      <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
    </div>
  );

  const cssVars = config ? themeConfigToCSS(config) : {};
  const sectionSharedProps = {
    social: config?.social,
    menus: config?.menus,
    brand: config?.brand,
  };

  const formatPrice = (val: string, cur: string) => {
    const num = parseFloat(val);
    if (isNaN(num)) return val;
    return new Intl.NumberFormat("fr-FR", { style: "currency", currency: cur, minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(num);
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
          <BackToTop settings={config?.backToTop || { enabled: true, position: "right", backgroundColor: "#1f2937", iconColor: "#ffffff", borderRadius: "9999px" }} />
          <NewsletterPopup settings={config?.newsletterPopup || { enabled: false, title: "", content: "", image: "", delay: 10, exitIntent: true, backgroundColor: "#ffffff", textColor: "#111827", buttonBg: "#059669", buttonText: "#ffffff" }} />
        </>
      )}
      <div style={{ ...cssVars, background: cssVars["--theme-bg"] || "#f9fafb", minHeight: "100vh", fontFamily: "var(--theme-font-body, inherit)", fontSize: config ? `${config.global.fonts.baseSize}px` : undefined } as React.CSSProperties}>
        {config && sectionComponents.header && (() => {
          const headerSection = config.sections.find(s => s.type === "header" && !s.disabled);
          if (!headerSection) return null;
          const HeaderComp = sectionComponents.header;
          return <HeaderComp settings={headerSection.settings} shopName={shopName} {...sectionSharedProps} />;
        })()}

        <div className="max-w-lg mx-auto px-4 py-20 text-center">
          <CheckCircle className="w-16 h-16 mx-auto mb-6" style={{ color: "var(--theme-primary, #059669)" }} />
          <h1 className="text-3xl font-bold mb-2" style={{ color: "var(--theme-text, #111827)" }}>
            Merci pour votre commande !
          </h1>
          <p className="mb-8" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
            Nous vous remercions pour votre achat. Un email de confirmation vous sera envoyé prochainement.
          </p>

          <div className="bg-white rounded-2xl border border-gray-200 p-6 text-left space-y-3 mb-8">
            {product && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Produit</span>
                <span className="text-sm font-medium text-gray-900">{product}</span>
              </div>
            )}
            {qty && (
              <div className="flex justify-between">
                <span className="text-sm text-gray-500">Quantité</span>
                <span className="text-sm font-medium text-gray-900">{qty}</span>
              </div>
            )}
            {price && (
              <div className="flex justify-between pt-3 border-t border-gray-100">
                <span className="text-sm text-gray-500">Total payé</span>
                <span className="text-lg font-bold" style={{ color: "var(--theme-primary, #059669)" }}>
                  {formatPrice(price, currency)}
                </span>
              </div>
            )}
          </div>

          <Link
            href={`/boutiques/${subdomain}`}
            className="inline-flex items-center gap-2 px-6 py-3 text-white font-semibold rounded-xl transition-colors text-sm"
            style={{ background: "var(--theme-primary, #059669)" }}
          >
            Retour à l'accueil
          </Link>
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
