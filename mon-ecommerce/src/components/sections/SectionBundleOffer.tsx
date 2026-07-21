"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { useShop } from "@/lib/shop-context";
import { Tag, ShoppingCart, Percent } from "lucide-react";
import EditableText, { hasTextValue } from "@/components/EditableText";

type OfferProduct = {
  product_id: string;
  product_name: string;
  quantity: number;
  image?: string;
};

type Offer = {
  id: string;
  name: string;
  description: string;
  type: "bundle" | "quantity";
  discount_type: "percentage" | "fixed";
  discount_value: number;
  min_quantity: number;
  products: OfferProduct[];
};

interface Props {
  settings?: {
    title?: string;
    subtitle?: string;
    layout?: "list" | "grid";
    text_align?: string;
    text_size?: string;
    font_family?: string;
  };
}

export default function SectionBundleOffer({ settings }: Props) {
  const { subdomain } = useShop();
  const [offers, setOffers] = useState<Offer[]>([]);
  const [loading, setLoading] = useState(true);

  const layout = settings?.layout || "list";
  const textAlign = settings?.text_align || "left";
  const fontFamily = settings?.font_family === "heading" ? "var(--theme-font-heading)" : "var(--theme-font-body)";
  const titleSize = settings?.text_size === "small" ? "text-xl sm:text-2xl" : settings?.text_size === "large" ? "text-3xl sm:text-4xl" : "text-2xl sm:text-3xl";
  const descSize = settings?.text_size === "small" ? "text-xs sm:text-sm" : settings?.text_size === "large" ? "text-base sm:text-lg" : "text-sm sm:text-base";

  useEffect(() => {
    if (!subdomain) return;
    let cancelled = false;
    supabase
      .from("offers")
      .select("id, name, description, type, discount_type, discount_value, min_quantity, products")
      .eq("shop_slug", subdomain)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (cancelled) return;
        if (error) { setLoading(false); return; }
        if (data) setOffers(data);
        setLoading(false);
      });
    return () => { cancelled = true; };
  }, [subdomain]);

  if (loading || !offers.length) return null;

  const formatPrice = (val: number) => `${val.toLocaleString()} XOF`;

  const formatDiscount = (offer: Offer) => {
    if (offer.discount_type === "percentage") return `${offer.discount_value}%`;
    return formatPrice(offer.discount_value);
  };

  return (
    <div className="mx-auto px-4 sm:px-6 py-8 sm:py-12" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
      <div className="text-center mb-8" style={{ textAlign: textAlign as any }}>
        <EditableText
          as="h2"
          value={settings?.title}
          fallback="Offres groupées"
          className={`${titleSize} font-bold`}
          style={{ color: "var(--theme-text, #111827)", fontFamily }}
        />
        {hasTextValue(settings?.subtitle) && (
          <EditableText
            as="p"
            value={settings?.subtitle}
            className={`${descSize} mt-2`}
            style={{ color: "var(--theme-text-muted, #6b7280)" }}
          />
        )}
      </div>

      <div className={`${layout === "grid" ? "grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4" : "space-y-4"}`}>
        {offers.map((offer) => (
          <div
            key={offer.id}
            className="bg-white rounded-xl border p-5 transition-all hover:shadow-md"
            style={{ borderColor: "var(--theme-border, #e5e7eb)", background: "var(--theme-surface, #ffffff)" }}
          >
            <div className="flex items-start gap-3 mb-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
                <Tag className="w-5 h-5" style={{ color: "var(--theme-primary, #059669)" }} />
              </div>
              <div className="flex-1 min-w-0">
                <h3 className="font-semibold text-base">{offer.name}</h3>
                {offer.description && (
                  <p className="text-sm mt-0.5" style={{ color: "var(--theme-text-muted, #6b7280)" }}>{offer.description}</p>
                )}
              </div>
            </div>

            <div className="flex items-center gap-2 mb-3">
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50" style={{ color: "var(--theme-primary, #059669)" }}>
                <Percent className="w-3 h-3" />
                {formatDiscount(offer)} de réduction
              </span>
              {offer.type === "quantity" && (
                <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-medium bg-blue-50 text-blue-700">
                  Min. {offer.min_quantity}
                </span>
              )}
            </div>

            <div className="space-y-2 mb-4">
              {offer.products.map((p) => (
                <div key={p.product_id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-gray-50">
                  {p.image ? (
                    <img src={p.image} alt="" className="w-8 h-8 rounded object-cover bg-gray-100" />
                  ) : (
                    <div className="w-8 h-8 rounded bg-gray-200 flex items-center justify-center">
                      <ShoppingCart className="w-3.5 h-3.5 text-gray-400" />
                    </div>
                  )}
                  <span className="text-sm font-medium truncate flex-1">{p.product_name}</span>
                  <span className="text-xs text-gray-500 shrink-0">x{p.quantity}</span>
                </div>
              ))}
            </div>

            <button
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-all"
              style={{
                background: "var(--theme-primary, #059669)",
                color: "white",
              }}
            >
              Ajouter au panier
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}
