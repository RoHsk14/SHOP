"use client";

import { useState, useEffect } from "react";
import { Heart } from "lucide-react";

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

function setWishlist(items: WishlistItem[]) {
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("wishlist-updated"));
}

export function useWishlistCount() {
  const [count, setCount] = useState(0);
  useEffect(() => {
    const update = () => setCount(getWishlist().length);
    update();
    window.addEventListener("wishlist-updated", update);
    return () => window.removeEventListener("wishlist-updated", update);
  }, []);
  return count;
}

export function isWishlisted(id: string): boolean {
  return getWishlist().some((i) => i.id === id);
}

export function toggleWishlist(item: WishlistItem) {
  const list = getWishlist();
  const idx = list.findIndex((i) => i.id === item.id);
  if (idx >= 0) {
    list.splice(idx, 1);
  } else {
    list.push(item);
  }
  setWishlist(list);
  return idx < 0;
}

interface Props {
  product: { id: string; name: string; price?: number | null; images?: string[] | null; slug?: string };
  size?: "sm" | "md";
}

export default function WishlistButton({ product, size = "md" }: Props) {
  const [wishlisted, setWishlisted] = useState(false);

  useEffect(() => {
    setWishlisted(isWishlisted(product.id));
  }, [product.id]);

  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    const now = toggleWishlist({
      id: product.id,
      name: product.name,
      price: product.price ?? 0,
      image: product.images?.[0],
      slug: product.slug || product.name.toLowerCase().replace(/\s+/g, "-"),
    });
    setWishlisted(now);
  };

  const sz = size === "sm" ? "w-4 h-4" : "w-5 h-5";

  return (
    <button
      onClick={handleClick}
      className={`p-1.5 rounded-full transition-all hover:scale-110 ${
        wishlisted ? "bg-red-50" : "bg-white/80 hover:bg-white"
      }`}
      aria-label={wishlisted ? "Retirer des favoris" : "Ajouter aux favoris"}
    >
      <Heart
        className={sz}
        style={{
          color: wishlisted ? "#ef4444" : "var(--theme-text-muted, #6b7280)",
          fill: wishlisted ? "#ef4444" : "transparent",
          transition: "all 0.2s",
        }}
      />
    </button>
  );
}
