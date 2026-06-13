"use client";

import { useState, useEffect, useRef } from "react";
import { ShoppingCart } from "lucide-react";
import { addToCart } from "@/components/CartDrawer";
import { useProduct } from "@/lib/product-context";
import { useShop } from "@/lib/shop-context";

interface Props {
  settings?: {
    show_image?: boolean;
    show_price?: boolean;
    button_text?: string;
  };
}

export default function SectionProductStickyCart({ settings }: Props) {
  const { product, loading } = useProduct();
  const { config } = useShop();
  const showCart = config?.layout?.showCart !== false;
  const [stickyVisible, setStickyVisible] = useState(false);
  const [added, setAdded] = useState(false);
  const sentinelRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const sentinel = sentinelRef.current;
    if (!sentinel) return;
    const observer = new IntersectionObserver(
      ([entry]) => setStickyVisible(!entry.isIntersecting),
      { threshold: 0 }
    );
    observer.observe(sentinel);
    return () => observer.disconnect();
  }, [loading]);

  if (loading || !product) return null;
  if (!showCart) return null;

  const outOfStock = product.stock_quantity != null && product.stock_quantity <= 0;
  const images = product.images?.length ? product.images : [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
  ];
  const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, "-");
  const showImage = settings?.show_image !== false;
  const showPrice = settings?.show_price !== false;
  const btnText = settings?.button_text || "Ajouter au panier";

  const handleAdd = () => {
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: images[0],
      slug,
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 2000);
  };

  return (
    <>
      <div ref={sentinelRef} />
      {stickyVisible && !outOfStock && (
        <div
          className="fixed bottom-0 left-0 right-0 z-40 border-t shadow-lg py-3 px-4 sm:px-6 backdrop-blur-md"
          style={{
            background: "var(--theme-surface, #ffffff)",
            borderColor: "var(--theme-border, #e5e7eb)",
          }}
        >
          <div className="mx-auto flex items-center justify-between gap-4" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
            <div className="flex items-center gap-3 min-w-0">
              {showImage && (
                <div className="w-10 h-10 rounded-lg overflow-hidden shrink-0" style={{ background: "var(--theme-secondary)" }}>
                  {images[0] && <img src={images[0]} alt="" className="w-full h-full object-cover" />}
                </div>
              )}
              <div className="min-w-0">
                <p className="text-sm font-semibold truncate" style={{ color: "var(--theme-text)" }}>{product.name}</p>
                {showPrice && (
                  <p className="text-sm font-bold" style={{ color: "var(--theme-primary)" }}>
                    {product.price?.toLocaleString()} XOF
                  </p>
                )}
              </div>
            </div>
            <button
              onClick={handleAdd}
              className="flex items-center gap-2 px-6 py-2.5 text-sm font-semibold rounded-xl whitespace-nowrap"
              style={{ background: "var(--theme-primary, #059669)", color: "#ffffff" }}
            >
              <ShoppingCart className="w-4 h-4" />
              {added ? "Ajouté ✓" : btnText}
            </button>
          </div>
        </div>
      )}
    </>
  );
}
