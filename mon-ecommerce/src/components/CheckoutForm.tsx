"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams, useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";
import * as metaPixel from "@/lib/metaPixel";
import { toast } from "sonner";
import { ShoppingBag, User, Phone, MapPin, Home } from "lucide-react";

interface FormField {
  name: string;
  label: string;
  required: boolean;
}

export interface PackOption {
  id: string;
  name: string;
  quantity: number;
  discountType?: "percentage" | "fixed";
  discountValue?: number;
  discountBadge?: string | null;
  discountPercent: number;
  totalPrice: number;
  originalPrice: number;
  popular?: boolean;
  offerRaw?: any;
}

interface Props {
  product: any;
  hidePriceHeader?: boolean;
  sectionSettings?: any;
  bundleOffers?: any[];
  selectedOffer?: any | null;
  onSelectOffer?: (offer: any) => void;
}

export default function CheckoutForm({
  product,
  hidePriceHeader = false,
  sectionSettings,
  bundleOffers = [],
  selectedOffer,
  onSelectOffer,
}: Props) {
  const { subdomain } = useParams<{ subdomain: string }>();
  const router = useRouter();

  const [dbSettings, setDbSettings] = useState<{
    id?: string;
    custom_form_fields?: FormField[];
    default_currency?: string;
    google_sheet_url?: string;
    google_sheet_columns?: string[];
    pixel_id?: string;
  } | null>(null);

  useEffect(() => {
    if (!subdomain) return;
    supabase
      .from("settings")
      .select("*")
      .eq("shop_slug", subdomain)
      .single()
      .then(({ data }) => {
        if (data) setDbSettings(data);
      });
  }, [subdomain]);

  const productCurrency = dbSettings?.default_currency || "XOF";
  const currencySymbol = ["XOF", "XAF"].includes(productCurrency) ? "CFA" : productCurrency;

  const formatCurrency = (val: number) => {
    return `${Math.round(val).toLocaleString("fr-FR")} ${currencySymbol}`;
  };

  const basePrice = product?.price && product.price > 0 ? product.price : 19500;
  const unitLabel = sectionSettings?.pack_unit_label || "boite";

  // Build pack options (from database bundleOffers or smart default tiers)
  const packs: PackOption[] = useMemo(() => {
    if (sectionSettings?.show_packs === false) {
      return [];
    }

    if (bundleOffers && bundleOffers.length > 0) {
      const list: PackOption[] = [
        {
          id: "pack-single",
          name: `1 ${unitLabel}`,
          quantity: 1,
          discountType: undefined,
          discountValue: 0,
          discountBadge: null,
          discountPercent: 0,
          totalPrice: basePrice,
          originalPrice: basePrice,
          popular: false,
          offerRaw: null,
        },
      ];

      bundleOffers.forEach((bo, idx) => {
        const qty = bo.min_quantity || idx + 2;
        const orig = basePrice * qty;
        let discPct = 0;
        let finalPrice = orig;
        const rawDiscount = Number(bo.discount_value) || 0;
        let discountBadge: string | null = null;

        if (bo.discount_type === "percentage") {
          discPct = Math.round(rawDiscount);
          finalPrice = Math.round(orig * (1 - discPct / 100));
          if (discPct > 0) {
            discountBadge = `- ${discPct}%`;
          }
        } else {
          // Montant fixe (XOF / devise du magasin)
          finalPrice = Math.max(0, orig - rawDiscount);
          discPct = orig > 0 ? Math.round(((orig - finalPrice) / orig) * 100) : 0;
          if (rawDiscount > 0) {
            discountBadge = `- ${rawDiscount.toLocaleString("fr-FR")} ${currencySymbol}`;
          }
        }

        const cleanName = (() => {
          const raw = (bo.name || "").trim();
          if (!raw || /^\d+$/.test(raw)) {
            const count = parseInt(raw, 10) || qty;
            return `${count} ${unitLabel}${count > 1 ? "s" : ""}`;
          }
          return raw;
        })();

        list.push({
          id: bo.id,
          name: cleanName,
          quantity: qty,
          discountType: bo.discount_type,
          discountValue: rawDiscount,
          discountBadge,
          discountPercent: discPct,
          totalPrice: finalPrice,
          originalPrice: orig,
          popular: bo.type === "popular" || idx === 0,
          offerRaw: bo,
        });
      });

      return list;
    }

    // When NO bundle offers exist for this product, return empty array.
    // The pack selection component MUST ONLY be present when bundle offers exist!
    return [];
  }, [bundleOffers, basePrice, unitLabel, sectionSettings?.show_packs, currencySymbol]);

  const [activePackId, setActivePackId] = useState<string>(() => {
    if (selectedOffer?.id) return selectedOffer.id;
    return packs.length > 1 ? packs[1].id : packs[0]?.id || "";
  });

  useEffect(() => {
    if (packs.length > 0) {
      if (selectedOffer?.id && packs.some((p) => p.id === selectedOffer.id)) {
        setActivePackId(selectedOffer.id);
      } else if (!packs.some((p) => p.id === activePackId)) {
        const defaultPack = packs.length > 1 ? packs[1] : packs[0];
        setActivePackId(defaultPack.id);
        if (onSelectOffer && defaultPack.offerRaw) {
          onSelectOffer(defaultPack.offerRaw);
        }
      }
    } else {
      setActivePackId("");
    }
  }, [packs, selectedOffer?.id]);

  const currentPack = useMemo(() => {
    return packs.find((p) => p.id === activePackId) || packs[0] || null;
  }, [packs, activePackId]);

  const quantity = currentPack?.quantity || 1;
  const totalPrice = currentPack ? currentPack.totalPrice : basePrice;

  const handleSelectPack = (pack: PackOption) => {
    setActivePackId(pack.id);
    if (onSelectOffer) {
      if (pack.offerRaw) {
        onSelectOffer(pack.offerRaw);
      } else if (pack.quantity > 1) {
        onSelectOffer({
          id: pack.id,
          name: pack.name,
          discount_type: "percentage",
          discount_value: pack.discountPercent,
          min_quantity: pack.quantity,
          type: "quantity",
          totalPrice: pack.totalPrice,
        });
      } else {
        onSelectOffer(null);
      }
    }
  };

  const selectedSize = product?.selectedSize;
  const productName = product?.name
    ? product.name + (selectedSize ? ` - ${selectedSize}` : "")
    : "Produit";

  const [formData, setFormData] = useState<Record<string, string>>({
    customer_name: "",
    customer_phone: "",
    customer_address: "",
  });
  const [loading, setLoading] = useState(false);

  const getFormFields = (): FormField[] => {
    if (dbSettings?.custom_form_fields && dbSettings.custom_form_fields.length > 0) {
      return dbSettings.custom_form_fields;
    }
    return [
      { name: "customer_name", label: "Prénom", required: true },
      { name: "customer_phone", label: "Téléphone", required: true },
      { name: "customer_address", label: "Adresse de livraison", required: true },
    ];
  };

  const getFieldIcon = (name: string, label: string) => {
    const combined = `${name} ${label}`.toLowerCase();
    if (combined.includes("phone") || combined.includes("tél") || combined.includes("tel") || combined.includes("whatsapp")) {
      return Phone;
    }
    if (combined.includes("name") || combined.includes("nom") || combined.includes("prénom") || combined.includes("client")) {
      return User;
    }
    if (combined.includes("neighborhood") || combined.includes("quartier")) {
      return Home;
    }
    return MapPin;
  };

  const getPlaceholder = (name: string, label: string) => {
    const combined = `${name} ${label}`.toLowerCase();
    if (combined.includes("prénom") || combined.includes("prenom")) return "Votre prénom";
    if (combined.includes("nom complet")) return "Votre nom complet";
    if (combined.includes("nom")) return "Votre prénom";
    if (combined.includes("phone") || combined.includes("tél") || combined.includes("tel") || combined.includes("whatsapp")) {
      return "Num. Téléphone";
    }
    if (combined.includes("adresse") || combined.includes("address") || combined.includes("ville")) {
      return "Quartier ou ville ";
    }
    if (combined.includes("quartier")) return "Votre quartier";
    return `Votre ${label.toLowerCase()}`;
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    metaPixel.trackInitiateCheckout({
      value: totalPrice,
      currency: productCurrency,
      num_items: quantity,
      content_ids: [product?.id],
    });

    const orderData: any = {
      product_id: product?.id,
      quantity,
      total_price: totalPrice,
      currency: productCurrency,
      product_name: productName,
      shop_slug: subdomain,
    };

    if (currentPack?.id && currentPack.id !== "pack-single" && currentPack.id !== "pack-1") {
      orderData.offer_id = currentPack.id;
      orderData.offer_name = currentPack.name;
    }

    getFormFields().forEach((field) => {
      if (formData[field.name]) orderData[field.name] = formData[field.name];
    });

    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(orderData),
    });

    setLoading(false);

    if (!res.ok) {
      const err = await res.json().catch(() => ({ error: "Erreur inconnue" }));
      toast.error(err.error || "Erreur lors de la commande");
    } else {
      if (dbSettings?.google_sheet_url) {
        let columns = dbSettings.google_sheet_columns || [
          "Date",
          "Nom du client",
          "Téléphone",
          "Adresse",
          "Quartier",
          "Produit",
          "Quantité",
          "Total",
          "Devise",
          "Statut",
          "Pays",
        ];

        if (!columns.some((c: string) => c.toLowerCase().includes("pays") || c.toLowerCase().includes("country"))) {
          columns = [...columns, "Pays"];
        }

        const rowData: any = {};
        columns.forEach((col: string) => {
          const colLower = col.toLowerCase();
          if (colLower.includes("date")) rowData[col] = new Date().toLocaleString("fr-FR");
          else if (colLower.includes("client") || colLower.includes("nom") || colLower.includes("prénom"))
            rowData[col] = formData.customer_name;
          else if (colLower.includes("tél") || colLower.includes("phone"))
            rowData[col] = formData.customer_phone;
          else if (colLower.includes("adresse")) rowData[col] = formData.customer_address;
          else if (colLower.includes("quartier") || colLower.includes("neighborhood"))
            rowData[col] = formData.customer_neighborhood || "";
          else if (colLower.includes("pays") || colLower.includes("country")) rowData[col] = "";
          else if (colLower.includes("produit") || colLower.includes("product")) rowData[col] = productName;
          else if (colLower.includes("quantité") || colLower.includes("quantity")) rowData[col] = quantity;
          else if (colLower.includes("total") || colLower.includes("price")) rowData[col] = totalPrice;
          else if (colLower.includes("devise") || colLower.includes("currency")) rowData[col] = productCurrency;
          else if (colLower.includes("statut") || colLower.includes("status")) rowData[col] = "À traiter";
          else rowData[col] = formData[colLower.replace(/\s/g, "_")] || "";
        });

        fetch("/api/google-sheets", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            sheet_url: dbSettings.google_sheet_url,
            columns,
            row_data: rowData,
            shop_slug: subdomain,
          }),
        }).catch((e) => console.error("Sheets error:", e));
      }

      router.push(
        `/boutiques/${subdomain}/thank-you?price=${totalPrice}&currency=${productCurrency}&product=${encodeURIComponent(
          product?.name || "Produit"
        )}&qty=${quantity}`
      );
    }
  };

  const formFields = getFormFields();

  const buttonBg = sectionSettings?.button_bg || "var(--theme-primary, #059669)";
  const buttonTextColor = sectionSettings?.button_text_color || "#ffffff";
  const buttonLabel = sectionSettings?.button_text || "VALIDER LA COMMANDE";
  const popularBadgeText = sectionSettings?.popular_badge_text || "Le plus populaire";
  const warningText =
    sectionSettings?.warning_text ||
    "Veuillez remplir le formulaire uniquement si vous êtes disponible pour receptionner votre colis";
  const warningColor = sectionSettings?.warning_color || "#dc2626";
  const showWarning = sectionSettings?.show_warning !== false;

  return (
    <div className="w-full">
      {/* ─── Red Notice Header ─── */}
      {showWarning && (
        <p
          className="text-center font-bold text-xs sm:text-sm tracking-wide leading-snug mb-3 sm:mb-4 px-1"
          style={{ color: warningColor }}
        >
          {warningText}
        </p>
      )}

      {/* ─── Pack / Quantity Offers Selection ─── */}
      {packs.length > 0 && (
        <div className="space-y-2 mb-3.5">
          {packs.map((pack) => {
            const isActive = pack.id === activePackId;
            return (
              <div
                key={pack.id}
                onClick={() => handleSelectPack(pack)}
                className={`relative p-2.5 sm:p-3.5 rounded-xl border-2 transition-all cursor-pointer flex items-center justify-between select-none ${isActive
                    ? "bg-emerald-50/30 border-emerald-600 shadow-2xs"
                    : "bg-white border-gray-200 hover:border-gray-300"
                  }`}
                style={{
                  borderRadius: "var(--theme-radius-card, 12px)",
                  borderColor: isActive
                    ? "var(--theme-primary, #059669)"
                    : "var(--theme-border, #e5e7eb)",
                  backgroundColor: isActive
                    ? "var(--theme-accent, #f0fdf4)"
                    : "var(--theme-surface, #ffffff)",
                }}
              >
                {/* Popular Corner Ribbon */}
                {pack.popular && (
                  <div
                    className="absolute -top-2.5 right-3 px-2.5 py-0.5 rounded-full text-white text-[10px] sm:text-xs font-bold tracking-wide shadow-xs shrink-0"
                    style={{
                      background: "var(--theme-primary, #059669)",
                    }}
                  >
                    {popularBadgeText}
                  </div>
                )}

                {/* Left Radio + Label + Badge */}
                <div className="flex items-center gap-2.5 min-w-0">
                  <div
                    className={`w-4 h-4 sm:w-5 sm:h-5 rounded-full border-2 flex items-center justify-center shrink-0 transition-colors ${isActive ? "border-emerald-600" : "border-gray-300 bg-white"
                      }`}
                    style={{
                      borderColor: isActive
                        ? "var(--theme-primary, #059669)"
                        : "var(--theme-border, #d1d5db)",
                    }}
                  >
                    {isActive && (
                      <div
                        className="w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full"
                        style={{ background: "var(--theme-primary, #059669)" }}
                      />
                    )}
                  </div>

                  <span className="font-extrabold text-xs sm:text-sm md:text-base text-gray-900 truncate">
                    {pack.name}
                  </span>

                  {pack.discountBadge && (
                    <span
                      className="px-1.5 py-0.5 rounded text-[10px] sm:text-[11px] font-bold shrink-0"
                      style={{
                        backgroundColor: "var(--theme-border, #e5e7eb)",
                        color: "var(--theme-text, #111827)",
                      }}
                    >
                      {pack.discountBadge}
                    </span>
                  )}
                </div>

                {/* Right Price Display */}
                <div className="text-right shrink-0 pl-2">
                  <div className="text-xs sm:text-sm md:text-base font-black text-gray-900 tracking-tight">
                    {formatCurrency(pack.totalPrice)}
                  </div>
                  {pack.originalPrice > pack.totalPrice && (
                    <div className="text-[10px] sm:text-xs text-gray-400 line-through font-medium">
                      {formatCurrency(pack.originalPrice)}
                    </div>
                  )}
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* ─── Order Form with Aligned Icon Addon Fields ─── */}
      <form onSubmit={handleSubmit} className="space-y-2.5 sm:space-y-3">
        {formFields.map((field) => {
          const Icon = getFieldIcon(field.name, field.label);
          return (
            <div key={field.name} className="flex items-center gap-2 sm:gap-3">
              <label className="w-20 sm:w-28 shrink-0 text-[11px] sm:text-xs md:text-sm font-bold text-gray-900 leading-tight">
                {field.label}
                {field.required && <span className="text-red-500 font-bold ml-0.5">*</span>}
              </label>

              <div
                className="flex-1 min-w-0 flex items-center bg-white border border-gray-200 transition-all focus-within:border-gray-400 focus-within:ring-2 focus-within:ring-black/5 overflow-hidden"
                style={{
                  borderRadius: "var(--theme-radius-input, 8px)",
                  borderColor: "var(--theme-border, #e5e7eb)",
                }}
              >
                <div className="w-8 h-8 sm:w-10 sm:h-10 bg-gray-100 flex items-center justify-center border-r border-gray-200 text-gray-700 shrink-0">
                  <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4 text-gray-800" />
                </div>
                <input
                  type={field.name.includes("phone") ? "tel" : "text"}
                  name={field.name}
                  value={formData[field.name] || ""}
                  onChange={handleChange}
                  required={field.required}
                  className="w-full px-2.5 sm:px-3 py-2 text-xs sm:text-sm font-medium text-gray-900 bg-transparent placeholder:text-[11px] sm:placeholder:text-xs placeholder:text-gray-400 focus:outline-none"
                  placeholder={getPlaceholder(field.name, field.label)}
                />
              </div>
            </div>
          );
        })}

        {/* ─── Submit Button (Conforming to active theme style & radius) ─── */}
        <button
          type="submit"
          disabled={loading}
          className="w-full py-3 sm:py-3.5 px-4 text-xs sm:text-sm md:text-base font-extrabold uppercase tracking-wide flex items-center justify-center cursor-pointer transition-all hover:opacity-95 active:scale-[0.99] shadow-sm mt-3"
          style={{
            background: buttonBg,
            color: buttonTextColor,
            borderRadius: "var(--theme-radius-button, 9999px)",
          }}
        >
          {loading ? (
            <span className="flex items-center gap-2">
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Validation de votre commande...
            </span>
          ) : (
            <span className="flex items-center justify-center gap-2">
              <ShoppingBag className="w-4 h-4 sm:w-5 sm:h-5 shrink-0" />
              <span>{buttonLabel}</span>
            </span>
          )}
        </button>
      </form>
    </div>
  );
}
