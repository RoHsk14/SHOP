"use client";

import { useState, useEffect } from "react";
import { useShop } from "@/lib/shop-context";
import ProductCard from "@/components/ProductCard";
import { Heart, ArrowLeft } from "lucide-react";

const WISHLIST_KEY = "shop-wishlist";

interface WishlistItem {
  id: string;
  name: string;
  price: number;
  image?: string;
  slug?: string;
}

function getWishlist(): WishlistItem[] {
  try {
    return JSON.parse(localStorage.getItem(WISHLIST_KEY) || "[]");
  } catch { return []; }
}

export default function SectionWishlistPage() {
  const { subdomain } = useShop();
  const [items, setItems] = useState<WishlistItem[]>([]);

  useEffect(() => {
    const update = () => setItems(getWishlist());
    update();
    window.addEventListener("wishlist-updated", update);
    return () => window.removeEventListener("wishlist-updated", update);
  }, []);

  return (
    <div className="mx-auto px-4 sm:px-6 py-6 sm:py-10" style={{ maxWidth: "var(--theme-container-width, 1200px)" }}>
      <div className="flex items-center gap-3 mb-6">
        <Heart className="w-6 h-6" style={{ color: "var(--theme-primary)" }} />
        <h1 className="text-2xl sm:text-3xl font-bold" style={{ color: "var(--theme-text)", fontFamily: "var(--theme-font-heading)" }}>
          Mes favoris
        </h1>
      </div>

      {items.length === 0 ? (
        <div className="text-center py-20">
          <Heart className="w-16 h-16 mx-auto mb-4" style={{ color: "var(--theme-text-muted)" }} />
          <p className="text-sm mb-2" style={{ color: "var(--theme-text-muted)" }}>
            Vous n&apos;avez pas encore de favoris.
          </p>
          <a
            href={`/boutiques/${subdomain}/products`}
            className="inline-flex items-center gap-2 text-sm font-semibold hover:opacity-70"
            style={{ color: "var(--theme-primary)" }}
          >
            <ArrowLeft className="w-4 h-4" />
            Découvrir nos produits
          </a>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6">
          {items.map((item) => (
            <ProductCard
              key={item.id}
              product={{
                id: item.id,
                name: item.name,
                price: item.price,
                images: item.image ? [item.image] : [],
                slug: item.slug,
              }}
              subdomain={subdomain}
              showBadges={false}
              showWishlist={true}
            />
          ))}
        </div>
      )}
    </div>
  );
}
