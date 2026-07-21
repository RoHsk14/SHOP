"use client";

import { useState, useEffect, ReactNode } from "react";
import { Tag, Percent } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { useProduct } from "@/lib/product-context";
import { useShop } from "@/lib/shop-context";
import CheckoutForm from "@/components/CheckoutForm";

interface Props {
  settings?: {
    show_title?: boolean;
    show_price?: boolean;
    show_description?: boolean;
    show_badges?: boolean;
    description_mode?: "inline" | "accordion" | "tabs";
    description_placement?: "inline" | "below";
    description_title?: string;
    description_bg?: string;
    image_position?: "left" | "right";
  };
}

export default function SectionProductInfo({ settings }: Props) {
  const { product, loading } = useProduct();
  const { subdomain } = useShop();

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
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) return;
        if (!data) return;
        const relevant = data.filter((o: any) =>
          o.products?.some((p: any) => p.product_id === product.id)
        );
        setBundleOffers(relevant);
      });
    return () => { cancelled = true; };
  }, [subdomain, product?.id]);

  if (loading || !product) return null;

  const offerActive = selectedOffer !== null;
  const displayQuantity = offerActive && selectedOffer.type === "quantity"
    ? selectedOffer.min_quantity
    : 1;

  const discountedPrice: number | null = (() => {
    if (!offerActive || !product.price) return null;
    const base = product.price * displayQuantity;
    if (selectedOffer.discount_type === "percentage") {
      return base * (1 - selectedOffer.discount_value / 100);
    }
    return Math.max(0, base - selectedOffer.discount_value);
  })();

  const toggleOffer = (offer: any) => {
    if (selectedOffer?.id === offer.id) {
      setSelectedOffer(null);
    } else {
      setSelectedOffer(offer);
    }
  };

  const hasDiscount = product.compareAtPrice && product.price && product.compareAtPrice > product.price;

  const showTitle = settings?.show_title !== false;
  const showPrice = settings?.show_price !== false;
  const showDesc = settings?.show_description !== false;
  const showBadges = settings?.show_badges !== false;
  const descMode = settings?.description_mode || "inline";
  const descPlacement = settings?.description_placement || "inline";
  const descTitle = settings?.description_title || "Description";
  const descBg = settings?.description_bg;

  const renderBadges = () => {
    if (!showBadges) return null;
    return (
      <div className="flex flex-wrap gap-2 mb-4">
        {hasDiscount && (
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "var(--theme-primary, #059669)", color: "#ffffff" }}
          >
            {(product as any).discount_percent ? `-${(product as any).discount_percent}%` : "Promo"}
          </span>
        )}
        {(product as any).is_new && (
          <span
            className="text-xs font-bold px-3 py-1 rounded-full"
            style={{ background: "#3b82f6", color: "#ffffff" }}
          >
            Nouveau
          </span>
        )}
      </div>
    );
  };

  const renderDescription = (): ReactNode => {
    if (!showDesc || !product.description) return null;

    const descContent = product.description.includes("<") ? (
      <div
        className="prose prose-sm max-w-none text-sm leading-relaxed"
        style={{ color: "var(--theme-text-muted, #6b7280)" }}
        dangerouslySetInnerHTML={{ __html: product.description }}
      />
    ) : (
      <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
        {product.description}
      </p>
    );

    if (descMode === "accordion") {
      return (
        <details className="group border-t pt-4 mt-4" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
          <summary
            className="text-xs font-bold uppercase tracking-wider mb-2 cursor-pointer flex items-center justify-between"
            style={{ color: "var(--theme-text-muted, #6b7280)" }}
          >
            {descTitle}
            <span className="transition-transform group-open:rotate-180">▼</span>
          </summary>
          <div className="mt-2">{descContent}</div>
        </details>
      );
    }

    if (descMode === "tabs") {
      return (
        <div className="pt-4 border-t mt-4" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
          <div className="flex border-b mb-4" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
            <button
              className="text-xs font-bold uppercase tracking-wider pb-2 px-1 border-b-2"
              style={{ color: "var(--theme-primary, #059669)", borderColor: "var(--theme-primary, #059669)" }}
            >
              {descTitle}
            </button>
          </div>
          {descContent}
        </div>
      );
    }

    return (
      <div className="pt-4 border-t" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
        <h2
          className="text-xs font-bold uppercase tracking-wider mb-2"
          style={{ color: "var(--theme-text-muted, #6b7280)" }}
        >
          {descTitle}
        </h2>
        {descContent}
      </div>
    );
  };

  const renderDescriptionFullWidth = (): ReactNode => {
    if (descPlacement !== "below" || !showDesc || !product.description) return null;

    const descContent = product.description.includes("<") ? (
      <div
        className="prose prose-sm max-w-none text-sm leading-relaxed"
        style={{ color: "var(--theme-text-muted, #6b7280)" }}
        dangerouslySetInnerHTML={{ __html: product.description }}
      />
    ) : (
      <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
        {product.description}
      </p>
    );

    return (
      <div className="mx-auto px-4 sm:px-6 pb-6 sm:pb-10" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        <div
          className="p-6 sm:p-8 lg:p-10"
          style={{
            background: descBg || "var(--theme-surface, #ffffff)",
            borderRadius: "var(--theme-radius-card, 16px)",
            border: "1px solid var(--theme-border, #e5e7eb)",
          }}
        >
          <h2
            className="text-lg sm:text-xl font-bold mb-4"
            style={{ color: "var(--theme-text, #111827)", fontFamily: "var(--theme-font-heading)" }}
          >
            {descTitle}
          </h2>
          {descContent}
        </div>
      </div>
    );
  };

  return (
    <>
      <div className={`mx-auto px-4 sm:px-6 pb-6 sm:pb-10`} style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        <div
          className="p-6 sm:p-8 lg:p-10"
          style={{
            background: "var(--theme-surface, #ffffff)",
            borderRadius: "var(--theme-radius-card, 16px)",
            border: "1px solid var(--theme-border, #e5e7eb)",
          }}
        >
          {showTitle && (
            <h1
              className="text-2xl sm:text-3xl font-bold leading-tight mb-3"
              style={{
                color: "var(--theme-text, #111827)",
                fontFamily: "var(--theme-font-heading)",
              }}
            >
              {product.name}
            </h1>
          )}

          {renderBadges()}

          {showPrice && (
            <div className="flex items-center gap-3 mb-6">
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--theme-primary, #059669)" }}>
                {offerActive
                  ? `${(discountedPrice || 0).toLocaleString()} XOF`
                  : product.price != null
                    ? `${product.price.toLocaleString()} XOF`
                    : "—"
                }
              </p>
              {hasDiscount && !offerActive && (
                <p className="text-base line-through" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
                  {product.compareAtPrice!.toLocaleString()} XOF
                </p>
              )}
              {offerActive && (
                <p className="text-base line-through" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
                  {(product.price! * displayQuantity).toLocaleString()} XOF
                </p>
              )}
            </div>
          )}

          {bundleOffers.length > 0 && (
            <div className="mb-6 space-y-2">
              <p className="text-xs font-semibold" style={{ color: "var(--theme-text, #111827)" }}>Offres groupées</p>
              {bundleOffers.map((offer) => {
                const isActive = selectedOffer?.id === offer.id;
                return (
                  <button
                    key={offer.id}
                    onClick={() => toggleOffer(offer)}
                    className={`w-full text-left border rounded-xl p-3 transition-all ${
                      isActive ? "ring-2" : "hover:ring-1"
                    }`}
                    style={{
                      borderColor: isActive ? "var(--theme-primary, #059669)" : "var(--theme-border, #e5e7eb)",
                      background: isActive ? "var(--theme-primary, #059669)" : "var(--theme-surface, #ffffff)",
                      color: isActive ? "#ffffff" : "var(--theme-text, #111827)",
                    }}
                  >
                    <div className="flex items-start gap-2">
                      <Tag className={`w-4 h-4 mt-0.5 shrink-0 ${isActive ? "text-white" : ""}`} style={{ color: isActive ? undefined : "var(--theme-primary, #059669)" }} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold">{offer.name}</p>
                        {offer.description && (
                          <p className={`text-xs mt-0.5 ${isActive ? "text-white/80" : ""}`} style={{ color: isActive ? undefined : "var(--theme-text-muted, #6b7280)" }}>
                            {offer.description}
                          </p>
                        )}
                        <div className="flex items-center gap-2 mt-1.5">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium ${
                            isActive ? "bg-white/20 text-white" : "bg-emerald-50"
                          }`} style={{ color: isActive ? undefined : "var(--theme-primary, #059669)" }}>
                            <Percent className="w-3 h-3" />
                            {offer.discount_type === "percentage" ? `${offer.discount_value}%` : `${offer.discount_value.toLocaleString()} XOF`} de réduction
                          </span>
                          {offer.type === "quantity" && (
                            <span className={`text-xs ${isActive ? "text-white/70" : "text-gray-500"}`}>Min. {offer.min_quantity}</span>
                          )}
                        </div>
                      </div>
                      {isActive && (
                        <span className="text-xs font-medium text-white/80">✓ Actif</span>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          )}

          <div className="mb-6">
            <CheckoutForm
              product={{
                ...product,
                offer: offerActive ? {
                  id: selectedOffer.id,
                  name: selectedOffer.name,
                  discount_type: selectedOffer.discount_type,
                  discount_value: selectedOffer.discount_value,
                  quantity: displayQuantity,
                  totalPrice: discountedPrice,
                } : undefined,
              }}
            />
          </div>

      {descPlacement !== "below" && renderDescription()}
    </div>
  </div>

  {renderDescriptionFullWidth()}
    </>
  );
}
