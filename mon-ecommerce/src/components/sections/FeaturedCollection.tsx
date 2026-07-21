"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { useShop } from "@/lib/shop-context";

interface Props {
  settings: {
    title?: string;
    description?: string;
    collection_slug?: string;
    settings?: {
      title?: string;
      description?: string;
      collection_slug?: string;
    };
  };
  layout?: any;
}

export default function FeaturedCollection({ settings, layout: _layout }: Props) {
  const { config, subdomain } = useShop();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const s = (settings.settings && (settings.settings.collection_slug || settings.settings.title))
    ? settings.settings
    : settings;
  const title = s.title;
  const description = s.description;
  const collectionSlug = s.collection_slug;

  useEffect(() => {
    let cancelled = false;
    if (!collectionSlug) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("products")
      .select("*")
      .eq("shop_slug", subdomain)
      .eq("category", collectionSlug)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) { setLoading(false); return; }
          if (data) setProducts(data);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [subdomain, collectionSlug]);

  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        {title && (
          <h2
            className="text-2xl sm:text-3xl font-bold text-center mb-2"
            style={{
              color: "var(--theme-text)",
              fontFamily: "var(--theme-font-heading)",
            }}
          >
            {title}
          </h2>
        )}
        {description && (
          <p className="text-center text-sm mb-8" style={{ color: "var(--theme-text-muted)" }}>
            {description}
          </p>
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>Aucun produit dans cette collection</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard
                key={product.id}
                product={product}
                subdomain={subdomain}
                showBadges={config?.layout?.showBadges !== false}
                showWishlist={config?.layout?.showWishlist !== false}
              />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
