"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProductCard from "@/components/ProductCard";
import { useShop } from "@/lib/shop-context";
import EditableText, { hasTextValue } from "@/components/EditableText";

interface Props {
  settings: {
    title?: any;
    description?: any;
  };
}

export default function FeaturedProducts({ settings }: Props) {
  const { config, subdomain } = useShop();
  const [products, setProducts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    supabase
      .from("products")
      .select("*")
      .eq("shop_slug", subdomain)
      .order("created_at", { ascending: false })
      .then(({ data, error }) => {
        if (!cancelled) {
          if (error) { setLoading(false); return; }
          if (data) setProducts(data);
          setLoading(false);
        }
      });
    return () => { cancelled = true; };
  }, [subdomain]);

  return (
    <section className="py-10 sm:py-16">
      <div className="mx-auto px-4 sm:px-6" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
        {hasTextValue(settings.title) && (
          <EditableText
            as="h2"
            value={settings.title}
            className="text-2xl sm:text-3xl font-bold text-center mb-2"
            style={{
              color: "var(--theme-text)",
              fontFamily: "var(--theme-font-heading)",
            }}
          />
        )}
        {hasTextValue(settings.description) && (
          <EditableText
            as="p"
            value={settings.description}
            className="text-center text-sm mb-8"
            style={{ color: "var(--theme-text-muted)" }}
          />
        )}

        {loading ? (
          <div className="flex justify-center py-12">
            <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
          </div>
        ) : products.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-sm" style={{ color: "var(--theme-text-muted)" }}>Aucun produit pour le moment.</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
            {products.map((product) => (
              <ProductCard key={product.id} product={product} subdomain={subdomain} showBadges={config?.layout?.showBadges !== false} showWishlist={config?.layout?.showWishlist !== false} />
            ))}
          </div>
        )}

        {products.length > 0 && (
          <div className="text-center mt-8">
            <a
              href={`/boutiques/${subdomain}/products`}
              className="inline-block px-6 py-2.5 text-sm font-semibold text-white transition-all hover:opacity-90"
              style={{
                background: "var(--theme-primary)",
                borderRadius: "var(--theme-radius-button)",
              }}
            >
              Voir tous les produits
            </a>
          </div>
        )}
      </div>
    </section>
  );
}
