"use client";

import { useState } from "react";
import Image from "next/image";
import { ChevronLeft, ChevronRight, Maximize2 } from "lucide-react";
import WishlistButton from "@/components/WishlistButton";
import ImageLightbox from "@/components/ImageLightbox";
import ProductDescriptionViewer from "@/components/ProductDescriptionViewer";
import { useProduct } from "@/lib/product-context";
import { useShop } from "@/lib/shop-context";

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
  const { isMobile } = useShop();
  const [activeImage, setActiveImage] = useState(0);
  const [lightboxOpen, setLightboxOpen] = useState(false);

  if (loading || !product) return null;

  const images = product.images?.length ? product.images : [
    "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
  ];

  const layout = settings?.layout || "sidebar";
  const thumbPos = settings?.thumbnails_position || "bottom";
  const isSticky = settings?.sticky !== false;
  const isZoom = settings?.zoom !== false;

  const nextImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImage((prev) => (prev + 1) % images.length);
  };

  const prevImage = (e?: React.MouseEvent) => {
    e?.stopPropagation();
    setActiveImage((prev) => (prev - 1 + images.length) % images.length);
  };

  const renderThumbnails = () => {
    if (thumbPos === "hidden" || images.length <= 1) return null;
    return (
      <div className="flex gap-2 sm:gap-3 overflow-x-auto pb-2 pt-1 scrollbar-thin">
        {images.map((url, i) => (
          <button
            key={`${url}-${i}`}
            onClick={() => setActiveImage(i)}
            className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 cursor-pointer ${
              i === activeImage
                ? "ring-2 ring-emerald-500 ring-offset-2 border-emerald-500 scale-102 shadow-sm"
                : "border-gray-200/80 hover:border-gray-400 opacity-70 hover:opacity-100"
            }`}
            style={{
              borderColor: i === activeImage ? "var(--theme-primary, #059669)" : undefined,
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
      className="group relative aspect-square sm:aspect-[4/5] rounded-2xl sm:rounded-3xl overflow-hidden mb-3 bg-gray-50 border border-gray-100 shadow-xs cursor-pointer select-none"
      onClick={() => settings?.lightbox !== false && setLightboxOpen(true)}
    >
      <Image
        src={images[activeImage]}
        alt={product.name}
        fill
        priority
        className={`object-cover object-center ${
          isZoom ? "group-hover:scale-105 transition-transform duration-500 ease-out" : ""
        }`}
        unoptimized
      />

      {/* Floating Action Controls */}
      <div className="absolute top-3 right-3 z-10 flex items-center gap-2">
        <div className="p-1.5 rounded-full bg-white/80 backdrop-blur-md shadow-xs text-gray-700 hover:text-gray-900 transition-colors">
          <WishlistButton product={product} />
        </div>
      </div>

      {/* Lightbox Trigger Hint */}
      <div className="absolute bottom-3 right-3 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-black/60 backdrop-blur-md text-white text-xs font-medium shadow-md">
          <Maximize2 className="w-3 h-3" />
          Agrandir
        </span>
      </div>

      {/* Image Counter Badge */}
      {images.length > 1 && (
        <div className="absolute bottom-3 left-3 z-10">
          <span className="px-2.5 py-1 rounded-full bg-black/50 backdrop-blur-md text-white text-[11px] font-semibold tracking-wide">
            {activeImage + 1} / {images.length}
          </span>
        </div>
      )}

      {/* Prev / Next Chevrons on Hover */}
      {images.length > 1 && (
        <>
          <button
            onClick={prevImage}
            aria-label="Photo précédente"
            className="absolute left-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer"
          >
            <ChevronLeft className="w-5 h-5 -ml-0.5" />
          </button>
          <button
            onClick={nextImage}
            aria-label="Photo suivante"
            className="absolute right-2.5 top-1/2 -translate-y-1/2 z-10 w-9 h-9 rounded-full bg-white/90 hover:bg-white text-gray-800 flex items-center justify-center shadow-md transition-all opacity-0 group-hover:opacity-100 hover:scale-105 cursor-pointer"
          >
            <ChevronRight className="w-5 h-5 -mr-0.5" />
          </button>
        </>
      )}
    </div>
  );

  return (
    <>
      <div className={`w-full ${isSticky ? "lg:sticky lg:top-24 self-start" : ""}`}>
        {thumbPos === "left" && images.length > 1 ? (
          <div className="flex gap-3 sm:gap-4">
            <div className="flex flex-col gap-2.5 shrink-0 max-h-[560px] overflow-y-auto scrollbar-thin">
              {images.map((url, i) => (
                <button
                  key={`${url}-${i}`}
                  onClick={() => setActiveImage(i)}
                  className={`relative w-16 h-16 sm:w-20 sm:h-20 rounded-xl overflow-hidden flex-shrink-0 border-2 transition-all duration-200 cursor-pointer ${
                    i === activeImage
                      ? "ring-2 ring-emerald-500 ring-offset-2 border-emerald-500 scale-102 shadow-sm"
                      : "border-gray-200/80 hover:border-gray-400 opacity-70 hover:opacity-100"
                  }`}
                  style={{
                    borderColor: i === activeImage ? "var(--theme-primary, #059669)" : undefined,
                  }}
                >
                  <Image src={url} alt="" fill className="object-cover" unoptimized />
                </button>
              ))}
            </div>
            <div className="flex-1 min-w-0">
              {renderMainImage()}
            </div>
          </div>
        ) : (
          <div className="w-full">
            {renderMainImage()}
            {renderThumbnails()}
          </div>
        )}

        {/* On PC / desktop: occupy the entire vertical space below the images with the rich description */}
        {!isMobile && product.description && (
          <div className="hidden lg:block pt-8 mt-6 border-t border-gray-100 desktop-only-description">
            <div className="flex items-center gap-2 mb-4">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-600 inline-block" />
              <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider">
                Description détaillée du produit
              </h2>
            </div>
            <ProductDescriptionViewer description={product.description} />
          </div>
        )}
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
