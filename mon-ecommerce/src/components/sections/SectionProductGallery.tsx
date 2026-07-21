"use client";

import { useState } from "react";
import Image from "next/image";
import WishlistButton from "@/components/WishlistButton";
import ImageLightbox from "@/components/ImageLightbox";
import { useProduct } from "@/lib/product-context";

interface Props {
  settings?: {
    lightbox?: boolean;
    layout?: "sidebar" | "grid" | "fullwidth" | "stacked";
    thumbnails_position?: "bottom" | "left" | "hidden";
    sticky?: boolean;
    zoom?: boolean;
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

  const layout = settings?.layout || "sidebar";
  const thumbPos = settings?.thumbnails_position || "bottom";
  const isSticky = settings?.sticky;
  const isZoom = settings?.zoom !== false;

  const renderThumbnails = () => {
    if (thumbPos === "hidden" || images.length <= 1) return null;
    return (
      <div className="flex gap-2 overflow-x-auto pb-1">
        {images.map((url, i) => (
          <button
            key={`${url}-${i}`}
            onClick={() => setActiveImage(i)}
            className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all"
            style={{
              borderColor: i === activeImage ? "var(--theme-primary, #059669)" : "var(--theme-border, #e5e7eb)",
            }}
          >
            <Image src={url} alt="" fill className="object-cover" unoptimized />
          </button>
        ))}
      </div>
    );
  };

  const renderMainImage = () => (
    <div
      className="relative aspect-square rounded-xl overflow-hidden mb-3"
      style={{
        background: "var(--theme-surface, #ffffff)",
        border: "1px solid var(--theme-border, #e5e7eb)",
        cursor: settings?.lightbox !== false ? "pointer" : "default",
      }}
      onClick={() => settings?.lightbox !== false && setLightboxOpen(true)}
    >
      <Image
        src={images[activeImage]}
        alt={product.name}
        fill
        className={`object-cover ${isZoom ? "hover:scale-105 transition-transform duration-500" : ""}`}
        unoptimized
      />
      <div className="absolute top-3 right-3">
        <WishlistButton product={product} />
      </div>
    </div>
  );

  if (layout === "fullwidth") {
    return (
      <>
        <div className="w-full mb-4">
          {renderMainImage()}
          {renderThumbnails()}
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

  if (layout === "grid") {
    return (
      <>
        <div className="grid grid-cols-2 gap-3 mb-4">
          {images.slice(0, 4).map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
              style={{ background: "var(--theme-surface, #ffffff)", border: "1px solid var(--theme-border, #e5e7eb)" }}
              onClick={() => { setActiveImage(i); settings?.lightbox !== false && setLightboxOpen(true); }}
            >
              <Image src={url} alt="" fill className="object-cover" unoptimized />
            </div>
          ))}
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

  if (layout === "stacked") {
    return (
      <>
        <div className="space-y-4 mb-4">
          {images.map((url, i) => (
            <div
              key={`${url}-${i}`}
              className="relative aspect-square rounded-xl overflow-hidden cursor-pointer"
              style={{ background: "var(--theme-surface, #ffffff)", border: "1px solid var(--theme-border, #e5e7eb)" }}
              onClick={() => { setActiveImage(i); settings?.lightbox !== false && setLightboxOpen(true); }}
            >
              <Image src={url} alt="" fill className="object-cover" unoptimized />
            </div>
          ))}
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

  /* sidebar (default) */
  return (
    <>
      <div
        className={`mx-auto px-4 sm:px-6 py-4 sm:py-6 ${isSticky ? "sticky top-6" : ""}`}
        style={{ maxWidth: "var(--theme-container-width, 1200px)" }}
      >
        <div
          className="overflow-hidden"
          style={{
            background: "var(--theme-surface, #ffffff)",
            borderRadius: "var(--theme-radius-card, 16px)",
            border: "1px solid var(--theme-border, #e5e7eb)",
          }}
        >
          <div className="p-4 sm:p-6 lg:p-8" style={{ background: "var(--theme-secondary, #f3f4f6)" }}>
            {thumbPos === "left" && images.length > 1 && (
              <div className="flex gap-3">
                <div className="flex flex-col gap-2 shrink-0">
                  {images.map((url, i) => (
                    <button
                      key={`${url}-${i}`}
                      onClick={() => setActiveImage(i)}
                      className="relative w-14 h-14 sm:w-16 sm:h-16 rounded-lg overflow-hidden flex-shrink-0 border-2 transition-all"
                      style={{
                        borderColor: i === activeImage ? "var(--theme-primary, #059669)" : "var(--theme-border, #e5e7eb)",
                      }}
                    >
                      <Image src={url} alt="" fill className="object-cover" unoptimized />
                    </button>
                  ))}
                </div>
                <div className="flex-1">
                  {renderMainImage()}
                </div>
              </div>
            )}
            {(thumbPos === "bottom" || thumbPos === "hidden" || images.length <= 1) && (
              <>
                {renderMainImage()}
                {renderThumbnails()}
              </>
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
