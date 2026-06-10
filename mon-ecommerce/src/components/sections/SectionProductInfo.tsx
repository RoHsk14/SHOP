"use client";

import { useState } from "react";
import { Minus, Plus, ShoppingCart, Ruler } from "lucide-react";
import { addToCart } from "@/components/CartDrawer";
import { useProduct } from "@/lib/product-context";
import { useShop } from "@/lib/shop-context";
import SizeGuide from "@/components/SizeGuide";
import CheckoutForm from "@/components/CheckoutForm";

interface Props {
  settings: {
    show_price?: boolean;
    show_description?: boolean;
    show_variants?: boolean;
    show_quantity?: boolean;
  };
}

export default function SectionProductInfo({ settings }: Props) {
  const { product, loading } = useProduct();
  const { config } = useShop();
  const showCart = config?.layout?.showCart !== false;
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [sizeGuideOpen, setSizeGuideOpen] = useState(false);

  if (loading || !product) return null;

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

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name + (selectedSize ? ` - ${selectedSize}` : ""),
      price: product.price || 0,
      image: images[0],
      slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  const showPrice = settings?.show_price !== false;
  const showDesc = settings?.show_description !== false;
  const showVariants = settings?.show_variants !== false;
  const showQty = settings?.show_quantity !== false;

  return (
    <>
      <div className="mx-auto px-4 sm:px-6 pb-6 sm:pb-10" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        <div
          className="p-6 sm:p-8 lg:p-10"
          style={{
            background: "var(--theme-surface, #ffffff)",
            borderRadius: "var(--theme-radius-card, 16px)",
            border: "1px solid var(--theme-border, #e5e7eb)",
          }}
        >
          <h1
            className="text-2xl sm:text-3xl font-bold leading-tight mb-3"
            style={{
              color: "var(--theme-text, #111827)",
              fontFamily: "var(--theme-font-heading)",
            }}
          >
            {product.name}
          </h1>

          {showPrice && (
            <div className="flex items-center gap-3 mb-6">
              <p className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--theme-primary, #059669)" }}>
                {product.price != null ? `${product.price.toLocaleString()} XOF` : "—"}
              </p>
              {hasDiscount && (
                <p className="text-base line-through" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
                  {product.compareAtPrice!.toLocaleString()} XOF
                </p>
              )}
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
            <div className="flex items-center gap-3 mb-6">
              {showQty && (
                <div className="flex items-center gap-1 border rounded-xl" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
                  <button
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    className="w-10 h-10 flex items-center justify-center hover:bg-gray-100 rounded-l-xl"
                  >
                    <Minus className="w-4 h-4" style={{ color: "var(--theme-text)" }} />
                  </button>
                  <span className="w-10 text-center text-sm font-semibold" style={{ color: "var(--theme-text)" }}>
                    {quantity}
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
                className="flex-1 flex items-center justify-center gap-2 py-3 text-sm font-semibold rounded-xl transition-all disabled:opacity-50"
                style={{
                  background: outOfStock ? "#9ca3af" : "var(--theme-primary, #059669)",
                  color: "#ffffff",
                }}
              >
                <ShoppingCart className="w-4 h-4" />
                {outOfStock ? "Épuisé" : added ? "Ajouté ✓" : "Ajouter au panier"}
              </button>
            </div>
          ) : (
            <div className="mb-6">
              <CheckoutForm product={{ ...product, selectedSize }} />
            </div>
          )}

          {showDesc && product.description && (
            <div className="pt-4 border-t" style={{ borderColor: "var(--theme-border, #e5e7eb)" }}>
              <h2
                className="text-xs font-bold uppercase tracking-wider mb-2 mt-2"
                style={{ color: "var(--theme-text-muted, #6b7280)" }}
              >
                Description
              </h2>
              {product.description.includes("<") ? (
                <div
                  className="prose prose-sm max-w-none text-sm leading-relaxed"
                  style={{ color: "var(--theme-text-muted, #6b7280)" }}
                  dangerouslySetInnerHTML={{ __html: product.description }}
                />
              ) : (
                <p className="text-sm leading-relaxed" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
                  {product.description}
                </p>
              )}
            </div>
          )}
        </div>
      </div>

      <SizeGuide open={sizeGuideOpen} onClose={() => setSizeGuideOpen(false)} />
    </>
  );
}
