"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import CheckoutForm from "@/components/CheckoutForm";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/currency";
import { slugify } from "@/lib/slug";
import * as metaPixel from "@/lib/metaPixel";

interface Product {
  id: string;
  name: string;
  description: string | null;
  prices: Record<string, number> | null;
  images: string[] | null;
  stock_quantity: number | null;
  [key: string]: any;
}

interface ProductShowcaseProps {
  products: Product[];
  initialProductId?: string;
}

export default function ProductShowcase({ products, initialProductId }: ProductShowcaseProps) {
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(() => {
    if (initialProductId) {
      return products.find(p => p.id === initialProductId) || products[0] || null;
    }
    return products[0] || null;
  });

  const selectProduct = (product: Product) => {
    setSelectedProduct(product);
    const slug = (product as any).slug || slugify(product.name);
    // Ancien format : redirection via pushState
    // window.history.pushState({}, "", `/products/${slug}`);
  };

  useEffect(() => {
    if (selectedProduct) {
      metaPixel.trackViewContent({
        content_ids: [selectedProduct.id],
        content_name: selectedProduct.name,
        content_type: "product",
        value: selectedProduct.prices ? Object.values(selectedProduct.prices)[0] : 0,
        currency: selectedProduct.prices ? Object.keys(selectedProduct.prices)[0] : "EUR",
      });
    }
  }, [selectedProduct]);

  if (!selectedProduct) {
    return (
      <div className="text-center py-20">
        <h1 className="text-xl font-bold mb-2" style={{ color: "var(--theme-text)" }}>Aucun produit disponible</h1>
        <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>Veuillez ajouter des produits dans l'admin.</p>
      </div>
    );
  }

  const imageUrl = selectedProduct.images && selectedProduct.images.length > 0
    ? selectedProduct.images[0]
    : "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop";

  const images = selectedProduct.images && selectedProduct.images.length > 0
    ? selectedProduct.images
    : ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"];

  const [activeImageIndex, setActiveImageIndex] = useState(0);

  return (
    <>
      <div className="overflow-hidden mb-8" style={{
        background: "var(--theme-surface)",
        borderRadius: "var(--theme-radius-card)",
        border: "1px solid var(--theme-border)",
      }}>
        {/* Image principale */}
        <div className="relative p-6 sm:p-10 flex items-center justify-center" style={{ background: "var(--theme-secondary)" }}>
          <div className="relative w-full max-w-lg aspect-square rounded-xl overflow-hidden" style={{
            background: "var(--theme-surface)",
            boxShadow: "0 1px 3px rgba(0,0,0,0.08)",
            border: "1px solid var(--theme-border)",
          }}>
            <Image
              src={images[activeImageIndex]}
              alt={selectedProduct.name}
              fill
              style={{ objectFit: "cover" }}
              className="hover:scale-105 transition-transform duration-500"
              unoptimized
            />
          </div>
          {(selectedProduct.stock_quantity || 0) > 0 && (
            <div className="absolute top-8 left-8 sm:top-12 sm:left-12 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm" style={{ background: "var(--theme-primary)" }}>
              <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
              En stock
            </div>
          )}
        </div>

        {/* Miniatures */}
        {images.length > 1 && (
          <div className="flex gap-2 px-6 sm:px-10 pb-6 overflow-x-auto">
            {images.map((url, i) => (
              <button
                key={i}
                onClick={() => setActiveImageIndex(i)}
                className={`relative w-16 h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all ${
                  i === activeImageIndex ? "border-emerald-600" : "hover:border-gray-300"
                }`}
                style={{
                  borderColor: i === activeImageIndex ? "var(--theme-primary)" : "var(--theme-border)",
                }}
              >
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              </button>
            ))}
          </div>
        )}

        {/* Nom + Prix */}
        <div className="px-6 sm:px-10 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold leading-tight" style={{
            color: "var(--theme-text)",
            fontFamily: "var(--theme-font-heading)",
          }}>
            {selectedProduct.name}
          </h1>
          {selectedProduct.prices && (
            <p className="text-xl sm:text-2xl font-bold mt-2" style={{ color: "var(--theme-primary)" }}>
              {formatPrice(Object.values(selectedProduct.prices)[0] || 0, Object.keys(selectedProduct.prices)[0])}
            </p>
          )}
        </div>

        {/* Formulaire de commande */}
        <div className="px-6 sm:px-10 pb-8">
          <CheckoutForm product={selectedProduct} />
        </div>

        {/* Description */}
        {selectedProduct.description && (
          <div className="px-6 sm:px-10 py-6 sm:py-8" style={{ borderTop: "1px solid var(--theme-border)" }}>
            <h2 className="text-sm font-bold uppercase tracking-wider mb-3" style={{
              color: "var(--theme-text)",
              fontFamily: "var(--theme-font-heading)",
            }}>Description</h2>
            {selectedProduct.description.includes("<") ? (
              <div
                className="prose prose-sm sm:prose max-w-none"
                style={{ color: "var(--theme-text-muted)" }}
                dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
              />
            ) : (
              <p className="text-sm sm:text-[15px] leading-relaxed" style={{ color: "var(--theme-text-muted)" }}>
                {selectedProduct.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sélecteur de produits */}
      {products.length > 1 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold mb-4" style={{
            color: "var(--theme-text)",
            fontFamily: "var(--theme-font-heading)",
          }}>Nos Produits</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => { selectProduct(product); setActiveImageIndex(0); }}
                className="flex-shrink-0 w-28 sm:w-32 rounded-xl border-2 transition-all"
                style={{
                  borderColor: selectedProduct.id === product.id ? "var(--theme-primary)" : "var(--theme-border)",
                  borderRadius: "var(--theme-radius-card)",
                  boxShadow: selectedProduct.id === product.id ? "0 4px 6px -1px rgba(0,0,0,0.1)" : "none",
                }}
              >
                <div className="relative w-full aspect-square rounded-t-lg overflow-hidden" style={{ background: "var(--theme-secondary)" }}>
                  <Image
                    src={product.images && product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-2 text-left">
                  <p className="text-xs font-medium truncate" style={{ color: "var(--theme-text)" }}>{product.name}</p>
                  <p className="text-xs" style={{ color: "var(--theme-text-muted)" }}>
                    {product.prices ? 
                      `${Object.values(product.prices)[0] || 0} ${Object.keys(product.prices)[0] || "EUR"}` 
                      : "N/A"}
                  </p>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </>
  );
}