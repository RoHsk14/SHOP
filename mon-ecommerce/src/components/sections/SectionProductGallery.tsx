"use client";

import { useState } from "react";
import Image from "next/image";
import WishlistButton from "@/components/WishlistButton";
import ImageLightbox from "@/components/ImageLightbox";
import { useProduct } from "@/lib/product-context";

interface Props {
  settings: {
    lightbox?: boolean;
  };
}

export default function SectionProductGallery({ settings }: Props) {
  const { product, loading } = useProduct();
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (loading || !product) return null;

  const images = product.images?.length ? product.images : [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
  ];

  return (
    <>
      <div className="mx-auto px-4 sm:px-6 py-4 sm:py-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        <div
          className="overflow-hidden"
          style={{
            background: "var(--theme-surface, #ffffff)",
            borderRadius: "var(--theme-radius-card, 16px)",
            border: "1px solid var(--theme-border, #e5e7eb)",
          }}
        >
          <div className="p-4 sm:p-6 lg:p-8" style={{ background: "var(--theme-secondary, #f3f4f6)" }}>
            <div
              className="relative aspect-square rounded-xl overflow-hidden mb-4 cursor-pointer"
              style={{
                background: "var(--theme-surface, #ffffff)",
                border: "1px solid var(--theme-border, #e5e7eb)",
              }}
              onClick={() => settings?.lightbox !== false && setLightboxOpen(true)}
            >
              <Image
                src={images[activeImage]}
                alt={product.name}
                fill
                className="object-cover hover:scale-105 transition-transform duration-500"
                unoptimized
              />
              <div className="absolute top-3 right-3">
                <WishlistButton product={product} />
              </div>
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
        </div>
      </div>

      {lightboxOpen && settings?.lightbox !== false && (
        <ImageLightbox
          images={images}
          activeIndex={activeImage}
          open={lightboxOpen}
          onClose={() => setLightboxOpen(false)}
          onPrev={() => setActiveImage((i) => (i - 1 + images.length) % images.length)}
          onNext={() => setActiveImage((i) => (i + 1) % images.length)}
        />
      )}
    </>
  );
}
