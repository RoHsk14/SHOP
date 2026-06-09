"use client";

import { useState, useEffect, useRef } from "react";
import Image from "next/image";
import { Minus, Plus, ShoppingCart, Ruler } from "lucide-react";
import { addToCart } from "@/components/CartDrawer";
import Breadcrumbs from "@/components/Breadcrumbs";
import WishlistButton from "@/components/WishlistButton";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  images?: string[] | null;
  stock_quantity?: number | null;
  slug?: string;
}

interface Props {
  product: Product;
  subdomain: string;
  showBreadcrumbs?: boolean;
  stickyAddToCart?: boolean;
  showWishlist?: boolean;
}

export default function ProductDetail({ product, subdomain, showBreadcrumbs = true, stickyAddToCart = true, showWishlist = true }: Props) {
  const images = product.images?.length ? product.images : [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
  ];
  const [activeImage, setActiveImage] = useState(0);
  const [quantity, setQuantity] = useState(1);
  const [added, setAdded] = useState(false);
  const [stickyVisible, setStickyVisible] = useState(false);
  const [selectedSize, setSelectedSize] = useState<string | null>(null);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const infoRef = useRef<HTMLDivElement>(null);
  const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, "-");
  const hasDiscount = product.compareAtPrice && product.price && product.compareAtPrice > product.price;
  const outOfStock = product.stock_quantity != null && product.stock_quantity <= 0;

  const sizes = ["XS", "S", "M", "L", "XL", "XXL"];
  const colors = [
    { name: "Noir", hex: "#000000" },
    { name: "Blanc", hex: "#ffffff" },
    { name: "Gris", hex: "#6b7280" },
    { name: "Vert", hex: "#059669" },
    { name: "Bleu", hex: "#3b82f6" },
    { name: "Rouge", hex: "#dc2626" },
  ];

  useEffect(() => {
    if (!stickyAddToCart) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    if (infoRef.current) observer.observe(infoRef.current);
    return () => observer.disconnect();
  }, [stickyAddToCart]);

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

  return (
    <>
      <div className="mx-auto px-4 sm:px-6 py-4 sm:py-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        {showBreadcrumbs && (
          <Breadcrumbs items={[
            { label: "Produits", href: `/boutiques/${subdomain}/products` },
            { label: product.name },
          ]} />
        )}

        <div
          className="overflow-hidden mt-2"
          style={{
            background: "var(--theme-surface, #ffffff)",
            borderRadius: "var(--theme-radius-card, 16px)",
            border: "1px solid var(--theme-border, #e5e7eb)",
          }}
        >
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
            {/* Image gallery */}
            <div ref={infoRef} className="p-4 sm:p-6 lg:p-8" style={{ background: "var(--theme-secondary, #f3f4f6)" }}>
              <div className="relative aspect-square rounded-xl overflow-hidden mb-4" style={{
                background: "var(--theme-surface, #ffffff)",
                border: "1px solid var(--theme-border, #e5e7eb)",
              }}>
                <Image
                  src={images[activeImage]}
                  alt={product.name}
                  fill
                  className="object-cover hover:scale-105 transition-transform duration-500"
                  unoptimized
                />
                {showWishlist && (
                  <div className="absolute top-3 right-3">
                    <WishlistButton product={product} />
                  </div>
                )}
              </div>
              {images.length > 1 && (
                <div className="flex gap-2 overflow-x-auto pb-2">
                  {images.map((url, i) => (
                    <button
                      key={i}
                      onClick={() => setActiveImage(i)}
                      className="relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all"
                      style={{
                        borderColor: i === activeImage ? "var(--theme-primary, #059669)" : "var(--theme-border, #e5e7eb)",
                      }}
                    >
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Product info */}
            <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-start">
              <h1
                className="text-2xl sm:text-3xl font-bold leading-tight mb-3"
                style={{
                  color: "var(--theme-text, #111827)",
                  fontFamily: "var(--theme-font-heading)",
                }}
              >
                {product.name}
              </h1>

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

              {/* Couleur */}
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

              {/* Taille */}
              <div className="mb-5">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-xs font-semibold" style={{ color: "var(--theme-text, #111827)" }}>
                    Taille : <span style={{ color: "var(--theme-text-muted)" }}>{selectedSize || "Sélectionner"}</span>
                  </p>
                  <button className="text-xs flex items-center gap-1 hover:opacity-70" style={{ color: "var(--theme-primary, #059669)" }}>
                    <Ruler className="w-3 h-3" />
                    Guide des tailles
                  </button>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {sizes.map((s) => (
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

              {/* Quantité + Add to cart */}
              <div className="flex items-center gap-3 mb-6">
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

              {/* Description */}
              {product.description && (
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
        </div>
      </div>

      {/* Sticky add to cart */}
      {stickyAddToCart && stickyVisible && !outOfStock && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t shadow-lg py-3 px-4 sm:px-6 backdrop-blur-md"
          style={{
            background: "var(--theme-surface, #ffffff)",
            borderColor: "var(--theme-border, #e5e7eb)",
          }}
        >
          <div className="mx-auto flex items-center justify-between gap-4" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--theme-secondary)" }}>
                {images[0] && <img src={images[0]} alt="" className="w-full h-full object-cover" />}
              </div>
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--theme-text)" }}>{product.name}</p>
                <p className="text-sm font-bold" style={{ color: "var(--theme-primary)" }}>
                  {product.price?.toLocaleString()} XOF
                </p>
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap"
              style={{ background: "var(--theme-primary, #059669)", color: "#ffffff" }}
            >
              <ShoppingCart className="w-4 h-4" />
              {added ? "Ajouté ✓" : "Ajouter au panier"}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
