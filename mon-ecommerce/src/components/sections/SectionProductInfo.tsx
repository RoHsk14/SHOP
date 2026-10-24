"use client";

import { useState, useEffect } from "react";
import {
  Star,
  Sparkles,
} from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProduct } from "@/lib/product-context";
import { useShop } from "@/lib/shop-context";
import CheckoutForm from "@/components/CheckoutForm";
import ReassuranceMarquee from "@/components/ReassuranceMarquee";
import ProductDescriptionViewer from "@/components/ProductDescriptionViewer";
import GoogleFontsLoader from "@/components/GoogleFontsLoader";

interface Props {
  settings?: {
    show_title?: boolean;
    title_font?: string;
    title_size?: "small" | "medium" | "large" | "xlarge" | "2xlarge";
    title_weight?: "normal" | "semibold" | "bold" | "extrabold" | "black";
    title_color?: string;
    title_align?: "left" | "center" | "right";
    show_price?: boolean;
    price_color?: string;
    price_size?: "medium" | "large" | "xlarge";
    show_rating?: boolean;
    show_badges?: boolean;
    show_reassurance?: boolean;
    reassurance_speed?: "slow" | "normal" | "fast";
    show_description?: boolean;
    description_placement?: "under_gallery" | "inline";
    description_title?: string;
    show_warning?: boolean;
    warning_text?: string;
    warning_color?: string;
    show_packs?: boolean;
    pack_unit_label?: string;
    form_bg?: string;
    form_border_color?: string;
    button_bg?: string;
    button_text?: string;
    button_text_color?: string;
    popular_badge_text?: string;
    stock_badge_text?: string;
  };
}

export default function SectionProductInfo({ settings }: Props) {
  const { product, loading } = useProduct();
  const { subdomain, isMobile } = useShop();

  const [bundleOffers, setBundleOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);

  useEffect(() => {
    if (!subdomain || !product?.id) return;
    let cancelled = false;
    supabase
      .from("offers")
      .select("id, name, description, discount_type, discount_value, min_quantity, type, products")
      .eq("shop_slug", subdomain)
      .eq("status", "active")
      .then(
        ({ data, error }: any) => {
          if (cancelled) return;
          if (error || !data) return;
          const relevant = data.filter((o: any) =>
            o.products?.some((p: any) => p.product_id === product.id)
          );
          setBundleOffers(relevant);
        },
        () => {}
      );
    return () => {
      cancelled = true;
    };
  }, [subdomain, product?.id]);

  if (loading || !product) return null;

  const offerActive = selectedOffer !== null;
  const displayQuantity =
    offerActive && (selectedOffer.min_quantity || selectedOffer.quantity)
      ? (selectedOffer.min_quantity || selectedOffer.quantity)
      : 1;

  const productPrice = product.price ?? 0;
  const compareAtPrice = product.compareAtPrice ?? 0;

  const discountedPrice: number | null = (() => {
    if (!offerActive || !productPrice) return null;
    if (typeof selectedOffer?.totalPrice === "number") return selectedOffer.totalPrice;
    const base = productPrice * displayQuantity;
    if (selectedOffer.discount_type === "percentage") {
      return base * (1 - selectedOffer.discount_value / 100);
    }
    return Math.max(0, base - selectedOffer.discount_value);
  })();


  const hasDiscount = compareAtPrice > productPrice && productPrice > 0;
  const savingsAmount = hasDiscount ? compareAtPrice - productPrice : 0;
  const savingsPercent = hasDiscount
    ? Math.round((savingsAmount / compareAtPrice) * 100)
    : 0;

  // Settings
  const showTitle = settings?.show_title !== false;
  const showPrice = settings?.show_price !== false;
  const showDesc = settings?.show_description !== false;
  const showBadges = settings?.show_badges !== false;
  const showRating = settings?.show_rating !== false;
  const showReassurance = settings?.show_reassurance !== false;
  const descriptionPlacement = settings?.description_placement || "under_gallery";

  // Title typography styles
  const titleFontFamily =
    settings?.title_font && settings.title_font !== "theme"
      ? settings.title_font
      : undefined;

  const titleSizeClass = (() => {
    switch (settings?.title_size) {
      case "small":
        return "text-lg sm:text-xl";
      case "medium":
        return "text-xl sm:text-2xl";
      case "xlarge":
        return "text-3xl sm:text-4xl";
      case "2xlarge":
        return "text-3xl sm:text-5xl";
      case "large":
      default:
        return "text-2xl sm:text-3xl lg:text-4xl";
    }
  })();

  const titleWeightClass = (() => {
    switch (settings?.title_weight) {
      case "normal":
        return "font-normal";
      case "semibold":
        return "font-semibold";
      case "bold":
        return "font-bold";
      case "black":
        return "font-black";
      case "extrabold":
      default:
        return "font-extrabold";
    }
  })();

  const titleAlignClass = (() => {
    switch (settings?.title_align) {
      case "center":
        return "text-center";
      case "right":
        return "text-right";
      case "left":
      default:
        return "text-left";
    }
  })();

  const priceSizeClass = (() => {
    switch (settings?.price_size) {
      case "medium":
        return "text-2xl sm:text-3xl";
      case "xlarge":
        return "text-4xl sm:text-5xl";
      case "large":
      default:
        return "text-3xl sm:text-4xl";
    }
  })();

  const priceColor = settings?.price_color || "var(--theme-primary, #059669)";
  const titleColor = settings?.title_color || "var(--theme-text, #111827)";

  return (
    <div className="w-full space-y-4 sm:space-y-5 lg:space-y-6 lg:sticky lg:top-20 self-start">
      {titleFontFamily && <GoogleFontsLoader fonts={{ heading: titleFontFamily }} />}

      {/* ─── Top Badge & In-Stock Status ─── */}
      <div className="flex flex-wrap items-center gap-2">
        {showBadges && (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60 shadow-2xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            {settings?.stock_badge_text || "En stock — Livraison gratuite"}
          </span>
        )}

        {hasDiscount && (
          <span className="inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-bold bg-red-50 text-red-600 border border-red-200/80">
            <Sparkles className="w-3 h-3" />
            Promo -{savingsPercent}%
          </span>
        )}

        {showBadges && (product as any).is_new && (
          <span className="px-3 py-1 rounded-full text-xs font-bold bg-blue-50 text-blue-600 border border-blue-200">
            Nouveau
          </span>
        )}
      </div>

      {/* ─── Product Title (Fully Customizable Typography) ─── */}
      {showTitle && (
        <div className={titleAlignClass}>
          <h1
            className={`${titleSizeClass} ${titleWeightClass} tracking-tight leading-snug`}
            style={{
              color: titleColor,
              fontFamily: titleFontFamily,
            }}
          >
            {product.name}
          </h1>

          {/* Social Proof Review Rating */}
          {showRating && (
            <div
              className={`flex items-center gap-2 mt-2.5 ${
                settings?.title_align === "center"
                  ? "justify-center"
                  : settings?.title_align === "right"
                  ? "justify-end"
                  : "justify-start"
              }`}
            >
              <div className="flex text-amber-400">
                {[...Array(5)].map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-amber-400" />
                ))}
              </div>
              <span className="text-xs font-bold text-gray-800">4.9 / 5</span>
              <span className="text-xs text-gray-400">•</span>
              <span className="text-xs font-medium text-gray-500 hover:text-emerald-600 cursor-pointer transition-colors">
                128 avis vérifiés
              </span>
            </div>
          )}
        </div>
      )}

      {/* ─── Price Showcase Box ─── */}
      {showPrice && (
        <div className="flex flex-wrap items-baseline gap-3 p-4 sm:p-5 rounded-2xl bg-gray-50/90 border border-gray-200/80">
          <span
            className={`${priceSizeClass} font-extrabold tracking-tight`}
            style={{ color: priceColor }}
          >
            {offerActive
              ? `${(discountedPrice || 0).toLocaleString()} XOF`
              : productPrice > 0
              ? `${productPrice.toLocaleString()} XOF`
              : "19 500 XOF"}
          </span>

          {hasDiscount && !offerActive && (
            <span className="text-base sm:text-lg text-gray-400 line-through font-medium">
              {compareAtPrice.toLocaleString()} XOF
            </span>
          )}

          {hasDiscount && !offerActive && savingsAmount > 0 && (
            <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
              Économisez {savingsAmount.toLocaleString()} XOF (-{savingsPercent}%)
            </span>
          )}

          {offerActive && productPrice > 0 && displayQuantity > 1 && discountedPrice !== null && (productPrice * displayQuantity) > discountedPrice && (
            <>
              <span className="text-base sm:text-lg text-gray-400 line-through font-medium">
                {(productPrice * displayQuantity).toLocaleString()} XOF
              </span>
              <span className="px-2.5 py-1 rounded-lg text-xs font-bold bg-emerald-100 text-emerald-800">
                {selectedOffer?.discount_type === "percentage"
                  ? `-${Math.round(selectedOffer.discount_value)}% (${((productPrice * displayQuantity) - discountedPrice).toLocaleString()} XOF)`
                  : `Économisez ${Number(selectedOffer?.discount_value || 0).toLocaleString()} XOF`}
              </span>
            </>
          )}
        </div>
      )}

      {/* ─── Simple High-Conversion Checkout Form Card (Conforming to active theme) ─── */}
      <div
        className="border transition-all p-3 sm:p-5 shadow-xs"
        style={{
          backgroundColor: settings?.form_bg || "var(--theme-surface, #ffffff)",
          borderColor: settings?.form_border_color || "var(--theme-border, #e5e7eb)",
          borderRadius: "var(--theme-radius-card, 16px)",
        }}
      >
        <CheckoutForm
          product={{
            ...product,
            price: productPrice > 0 ? productPrice : 19500,
          }}
          hidePriceHeader={true}
          sectionSettings={settings}
          bundleOffers={bundleOffers}
          selectedOffer={selectedOffer}
          onSelectOffer={setSelectedOffer}
        />
      </div>

      {/* ─── Description on Mobile (below checkout form) ─── */}
      {showDesc && product.description && (
        <div className="lg:hidden block pt-4 border-t border-gray-100 mobile-only-description">
          <div className="flex items-center gap-2 mb-3">
            <span className="w-2 h-2 rounded-full bg-emerald-600 inline-block" />
            <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
              {settings?.description_title || "Description détaillée"}
            </h3>
          </div>
          <ProductDescriptionViewer description={product.description} />
        </div>
      )}

      {/* ─── Moving Reassurance Marquee Banner (Left to Right) ─── */}
      {showReassurance && (
        <div className="pt-2">
          <ReassuranceMarquee speed={settings?.reassurance_speed || "normal"} />
        </div>
      )}
    </div>
  );
}
