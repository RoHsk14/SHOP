"use client";

import { useState, useEffect, ReactNode } from "react";
import { Minus, Plus, ShoppingCart, Ruler, Heart, Tag, Percent } from "lucide-react";
import { supabase } from "@/lib/supabase";
import { addToCart } from "@/components/CartDrawer";
import { useProduct } from "@/lib/product-context";
import { useShop } from "@/lib/shop-context";
import SizeGuide from "@/components/SizeGuide";
import CheckoutForm from "@/components/CheckoutForm";

interface Props {
  settings?: {
    show_title?: boolean;
    show_price?: boolean;
    show_description?: boolean;
    show_variants?: boolean;
    show_quantity?: boolean;
    show_badges?: boolean;
    show_wishlist?: boolean;
    description_mode?: "inline" | "accordion" | "tabs";
    description_placement?: "inline" | "below";
    description_title?: string;
    description_bg?: string;
    button_style?: "full" | "compact" | "ghost";
    image_position?: "left" | "right";
  };
}

export default function SectionProductInfo({ settings }: Props) {
  const { product, loading } = useProduct();
  const { config, subdomain } = useShop();
  const showCart = config?.layout?.showCart !== false;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  const [bundleOffers, setBundleOffers] = useState<any[]>([]);
  const [selectedOffer, setSelectedOffer] = useState<any | null>(null);

  useEffect(() => {
    if (!subdomain || !product?.id) return;
    supabase
      .from("offers")
      .select("id, name, description, discount_type, discount_value, min_quantity, type, products")
      .eq("shop_slug", subdomain)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (!data) return;
        const relevant = data.filter((o: any) =>
          o.products?.some((p: any) => p.product_id === product.id)
        );
        setBundleOffers(relevant);
      });
  }, [subdomain, product?.id]);

  if (loading || !product) return null;

  const offerActive = selectedOffer !== null;
  const offerQty = selectedOffer
    ? selectedOffer.products.reduce((s: number, p: any) => s + p.quantity, 0)
    : 0;
  const displayQuantity = offerActive && selectedOffer.type === "quantity"
    ? Math.max(quantity, selectedOffer.min_quantity)
    : quantity;

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
      if (offer.type === "quantity") setQuantity(1);
    } else {
      setSelectedOffer(offer);
      if (offer.type === "quantity") setQuantity(offer.min_quantity);
    }
  };

  const hasDiscount = product.compareAtPrice && product.price && product.compareAtPrice > product.price;
  const outOfStock = product.stock_quantity != null && product.stock_quantity <= 0;
  const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, "-");
  const images = product.images?.length ? product.images : [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
  ];

  const sizes = (product as any).sizes?.length ? (product as any).sizes : ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = [
    { name: "Noir", hex: "#000000" },
    { name: "Blanc", hex: "#ffffff" },
    { name: "Gris", hex: "#6b7280" },
    { name: "Vert", hex: "#059669" },
    { name: "Bleu", hex: "#3b82f6" },
    { name: "Rouge", hex: "#dc2626" },
  ];

  const showTitle = settings?.show_title !== false;
  const showPrice = settings?.show_price !== false;
  const showDesc = settings?.show_description !== false;
  const showVariants = settings?.show_variants !== false;
  const showQty = settings?.show_quantity !== false;
  const showBadges = settings?.show_badges !== false;
  const showWishlist = settings?.show_wishlist !== false;
  const descMode = settings?.description_mode || "inline";
  const descPlacement = settings?.description_placement || "inline";
  const descTitle = settings?.description_title || "Description";
  const descBg = settings?.description_bg;
  const btnStyle = settings?.button_style || "full";

  const handleAdd = () => {
    if (offerActive && selectedOffer.type === "quantity") {
      const unitPrice = product.price
        ? selectedOffer.discount_type === "percentage"
          ? product.price * (1 - selectedOffer.discount_value / 100)
          : Math.max(0, product.price - selectedOffer.discount_value / selectedOffer.min_quantity)
        : 0;
      for (let i = 0; i < displayQuantity; i++) {
        addToCart({
          id: product.id,
          name: product.name + (selectedSize ? ` - ${selectedSize}` : ""),
          price: unitPrice,
          image: images[0],
          slug,
        });
      }
    } else {
      addToCart({
        id: product.id,
        name: product.name + (selectedSize ? ` - ${selectedSize}` : ""),
        price: product.price || 0,
        image: images[0],
        slug,
      });
    }
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

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

          {showVariants && (
            <>
              <div className="mb-5">
                <p className="text-xs font-semibold mb-2" style={{ color: "var(--theme-text, #111827)" }}>
                  Couleur : <span style={{ color: "var(--theme-text-muted)" }}>{selectedColor || "Sélectionner"}</span>
                </p>
                <div className="flex gap-2">
                  {colors.map((c) => (
                    <button
                      key={c.hex}
                      onClick={() => setSelectedColor(c.name)}
                      className="w-8 h-8 rounded-full border-2 transition-all hover:scale-110"
                      style={{
                        background: c.hex,
                        borderColor: c.hex === "#ffffff" ? "var(--theme-border, #e5e7eb)" : selectedColor === c.name ? "var(--theme-primary, #059669)" : "transparent",
                        outline: selectedColor === c.name ? "2px solid var(--theme-primary, #059669)" : undefined,
                        outlineOffset: "2px",
                      }}
                      title={c.name}
                    />
                  ))}
                </div>
              </div>

              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: "var(--theme-text, #111827)" }}>
                    Taille : <span style={{ color: "var(--theme-text-muted)" }}>{selectedSize || "Sélectionner"}</span>
                  </p>
                  <button
                    onClick={() => setSizeGuideOpen(true)}
                    className="text-xs flex items-center gap-1 hover:opacity-70"
                    style={{ color: "var(--theme-primary, #059669)" }}
                  >
                    <Ruler className="w-3 h-3" />
                    Guide des tailles
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((s: string) => (
                    <button
                      key={s}
                      onClick={() => setSelectedSize(s)}
                      className="px-3.5 py-2 text-xs font-medium rounded-lg border transition-all"
                      style={{
                        background: selectedSize === s ? "var(--theme-primary, #059669)" : "var(--theme-surface, #fff)",
                        color: selectedSize === s ? "#ffffff" : "var(--theme-text, #111827)",
                        borderColor: selectedSize === s ? "var(--theme-primary, #059669)" : "var(--theme-border, #e5e7eb)",
                      }}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            </>
          )}

          {showCart ? (
            <div className={`flex items-center gap-3 mb-6 ${btnStyle === "compact" ? "flex-wrap" : ""}`}>
              {showQty && (
                <div className="flex items-center gap-1 border rounded-xl" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
                  <button
                    onClick={() => setQuantity(Math.max(offerActive && selectedOffer.type === "quantity" ? selectedOffer.min_quantity : 1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-l-xl"
                    style={{ opacity: (offerActive && selectedOffer.type === "quantity" && quantity <= selectedOffer.min_quantity) ? 0.4 : 1 }}
                    disabled={offerActive && selectedOffer.type === "quantity" && quantity <= selectedOffer.min_quantity}
                  >
                    <Minus className="w-4 h-4" style={{ color: "var(--theme-text)" }} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
                    {offerActive && selectedOffer.type === "quantity" ? Math.max(quantity, selectedOffer.min_quantity) : quantity}
                  </span>
                  <button
                    onClick={() => setQuantity(quantity + 1)}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-r-xl"
                  >
                    <Plus className="w-4 h-4" style={{ color: "var(--theme-text)" }} />
                  </button>
                </div>
              )}

              <button
                onClick={handleAdd}
                disabled={outOfStock}
                className={`${btnStyle === "ghost" ? "" : "flex-1"} flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-50`}
                style={{
                  background: outOfStock ? "#9ca3af" : btnStyle === "ghost" ? "transparent" : "var(--theme-primary, #059669)",
                  color: btnStyle === "ghost" ? "var(--theme-primary, #059669)" : "#ffffff",
                  border: btnStyle === "ghost" ? "2px solid var(--theme-primary, #059669)" : "none",
                  padding: btnStyle === "compact" ? "8px 16px" : "12px 24px",
                  flex: btnStyle === "full" ? 1 : undefined,
                  width: btnStyle === "full" ? "100%" : "auto",
                }}
              >
                <ShoppingCart className="w-4 h-4" />
                {outOfStock ? "Épuisé" : added ? "Ajouté ✓" : "Ajouter au panier"}
              </button>
              {showWishlist && (
                <button
                  onClick={() => {}}
                  className="w-10 h-10 flex items-center justify-center rounded-xl border transition-all hover:scale-110"
                  style={{ borderColor: "var(--theme-border, #e5e7eb)" }}
                  title="Ajouter aux favoris"
                >
                  <Heart className="w-4 h-4" style={{ color: "var(--theme-text-muted, #6b7280)" }} />
                </button>
              )}
            </div>
          ) : (
            <div className="mb-6">
              <CheckoutForm
                product={{
                  ...product,
                  selectedSize,
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
          )}

      {descPlacement !== "below" && renderDescription()}
    </div>
  </div>

  {renderDescriptionFullWidth()}

      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </>
  );
}
