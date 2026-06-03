"use client";

import { useState } from "react";
import Image from "next/image";
import CheckoutForm from "@/components/CheckoutForm";
interface Product {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  images?: string[] | null;
  stock_quantity?: number | null;
}

export default function ProductDetail({ product }: { product: Product }) {
  const images = product.images?.length ? product.images : [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
  ];
  const [activeImage, setActiveImage] = useState(0);

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
      <div
        className="overflow-hidden"
        style={{
          background: "var(--theme-surface, #ffffff)",
          borderRadius: "var(--theme-radius-card, 16px)",
          border: "1px solid var(--theme-border, #e5e7eb)",
        }}
      >
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-0">
          {/* Image gallery */}
          <div className="p-4 sm:p-6 lg:p-8" style={{ background: "var(--theme-secondary, #f3f4f6)" }}>
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
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col justify-center">
            <h1
              className="text-2xl sm:text-3xl font-bold leading-tight mb-3"
              style={{
                color: "var(--theme-text, #111827)",
                fontFamily: "var(--theme-font-heading)",
              }}
            >
              {product.name}
            </h1>

            {product.price != null && product.price > 0 && (
              <p className="text-2xl sm:text-3xl font-bold mb-6" style={{ color: "var(--theme-primary, #059669)" }}>
                {product.price.toLocaleString()} XOF
              </p>
            )}

            {/* Checkout — avant la description */}
            <div className="mb-6">
              <CheckoutForm product={product} />
            </div>

            {/* Description — après le checkout */}
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
  );
}
