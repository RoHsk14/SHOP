"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import CheckoutForm from "@/components/CheckoutForm";
import { supabase } from "@/lib/supabase";
import { formatPrice } from "@/lib/currency";
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
    const url = new URL(window.location.href);
    url.searchParams.set("product", product.id);
    window.history.pushState({}, "", url.toString());
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
        <h1 className="text-xl font-bold text-gray-900 mb-2">Aucun produit disponible</h1>
        <p className="text-gray-500 text-sm">Veuillez ajouter des produits dans l'admin.</p>
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
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        {/* Image principale */}
        <div className="relative bg-gray-50 p-6 sm:p-10 flex items-center justify-center">
          <div className="relative w-full max-w-lg aspect-square rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
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
            <div className="absolute top-8 left-8 sm:top-12 sm:left-12 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
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
                  i === activeImageIndex ? "border-emerald-600" : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <Image src={url} alt="" fill className="object-cover" unoptimized />
              </button>
            ))}
          </div>
        )}

        {/* Nom + Prix */}
        <div className="px-6 sm:px-10 pb-4">
          <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 leading-tight">
            {selectedProduct.name}
          </h1>
          {selectedProduct.prices && (
            <p className="text-xl sm:text-2xl font-bold text-emerald-600 mt-2">
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
          <div className="border-t border-gray-100 px-6 sm:px-10 py-6 sm:py-8">
            <h2 className="text-sm font-bold text-gray-900 uppercase tracking-wider mb-3">Description</h2>
            {selectedProduct.description.includes("<") ? (
              <div
                className="prose prose-sm sm:prose max-w-none text-gray-600"
                dangerouslySetInnerHTML={{ __html: selectedProduct.description }}
              />
            ) : (
              <p className="text-sm sm:text-[15px] text-gray-600 leading-relaxed">
                {selectedProduct.description}
              </p>
            )}
          </div>
        )}
      </div>

      {/* Sélecteur de produits */}
      {products.length > 1 && (
        <div className="mb-8">
          <h2 className="text-lg font-bold text-gray-900 mb-4">Nos Produits</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => { selectProduct(product); setActiveImageIndex(0); }}
                className={`flex-shrink-0 w-28 sm:w-32 rounded-xl border-2 transition-all ${
                  selectedProduct.id === product.id
                    ? "border-emerald-600 shadow-md"
                    : "border-gray-200 hover:border-gray-300"
                }`}
              >
                <div className="relative w-full aspect-square rounded-t-lg overflow-hidden bg-gray-50">
                  <Image
                    src={product.images && product.images[0] || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"}
                    alt={product.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="p-2 text-left">
                  <p className="text-xs font-medium text-gray-900 truncate">{product.name}</p>
                  <p className="text-xs text-gray-500">
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
