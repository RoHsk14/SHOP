"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import CheckoutForm from "@/components/CheckoutForm";
import { supabase } from "@/lib/supabase";

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

  return (
    <>
      {/* Selected Product Display */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-200 overflow-hidden mb-8">
        <div className="grid grid-cols-1 lg:grid-cols-2">
          {/* Image Section */}
          <div className="relative bg-gray-50 p-6 sm:p-8 lg:p-10 flex items-center justify-center">
            <div className="relative w-full aspect-square max-w-md rounded-xl overflow-hidden bg-white shadow-sm border border-gray-100">
              <Image
                src={imageUrl}
                alt={selectedProduct.name}
                fill
                style={{ objectFit: "cover" }}
                className="hover:scale-105 transition-transform duration-500"
                unoptimized
              />
            </div>
            {(selectedProduct.stock_quantity || 0) > 0 && (
              <div className="absolute top-8 left-8 lg:top-12 lg:left-12 bg-green-600 text-white text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1.5 shadow-sm">
                <span className="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                En stock
              </div>
            )}
          </div>

          {/* Product Info + Checkout */}
          <div className="p-6 sm:p-8 lg:p-10 flex flex-col">
            <div className="mb-6 sm:mb-8">
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 mb-3 leading-tight">
                {selectedProduct.name}
              </h1>
              <p className="text-gray-500 text-sm sm:text-[15px] leading-relaxed mb-4 sm:mb-6">
                {selectedProduct.description || "Découvrez ce produit exclusif."}
              </p>

              <div className="flex flex-wrap gap-3">
                {[
                  { icon: "🛡️", text: "Paiement à la livraison" },
                  { icon: "🚚", text: "Livraison rapide" },
                  { icon: "✅", text: "Qualité garantie" },
                ].map((item, i) => (
                  <div key={i} className="flex items-center gap-2 bg-green-50 text-green-800 text-xs sm:text-sm font-medium px-3 py-2 rounded-lg border border-green-100">
                    <span>{item.icon}</span>
                    <span>{item.text}</span>
                  </div>
                ))}
              </div>
            </div>

            <CheckoutForm product={selectedProduct} />
          </div>
        </div>
      </div>

      {/* Product Gallery - En bas */}
      {products.length > 1 && (
        <div>
          <h2 className="text-lg font-bold text-gray-900 mb-4">Nos Produits</h2>
          <div className="flex gap-4 overflow-x-auto pb-4 scrollbar-thin">
            {products.map((product) => (
              <button
                key={product.id}
                onClick={() => selectProduct(product)}
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
