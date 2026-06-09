"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { ShoppingCart } from "lucide-react";
import { addToCart } from "@/components/CartDrawer";
import WishlistButton from "@/components/WishlistButton";

interface Product {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  compareAtPrice?: number | null;
  images?: string[] | null;
  stock_quantity?: number | null;
  slug?: string;
  created_at?: string;
}

interface ProductCardProps {
  product: Product;
  subdomain: string;
  showBadges?: boolean;
  showWishlist?: boolean;
}

function getBadges(product: Product, showBadges: boolean | undefined) {
  if (!showBadges) return [] as { label: string; variant: string }[];
  const badges: { label: string; variant: string }[] = [];

  if (product.created_at) {
    const daysOld = (Date.now() - new Date(product.created_at).getTime()) / 86400000;
    if (daysOld < 30) badges.push({ label: "Nouveau", variant: "new" });
  }

  if (product.compareAtPrice && product.price && product.compareAtPrice > product.price) {
    const pct = Math.round((1 - product.price / product.compareAtPrice) * 100);
    badges.push({ label: `-${pct}%`, variant: "sale" });
  }

  if (product.stock_quantity != null && product.stock_quantity <= 0) {
    badges.push({ label: "Épuisé", variant: "soldout" });
  }

  return badges;
}

const BADGE_STYLES: Record<string, { bg: string; text: string }> = {
  new: { bg: "#059669", text: "#ffffff" },
  sale: { bg: "#dc2626", text: "#ffffff" },
  soldout: { bg: "#6b7280", text: "#ffffff" },
};

export default function ProductCard({ product, subdomain, showBadges = true, showWishlist = true }: ProductCardProps) {
  const imageUrl = product.images?.[0]
    || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop";
  const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, "-");
  const badges = getBadges(product, showBadges);
  const hasDiscount = product.compareAtPrice && product.price && product.compareAtPrice > product.price;

  const handleQuickAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    addToCart({
      id: product.id,
      name: product.name,
      price: product.price || 0,
      image: imageUrl,
      slug,
    });
  };

  return (
    <Link
      href={`/boutiques/${subdomain}/products/${slug}`}
      className="group block rounded-xl overflow-hidden transition-all hover:shadow-lg relative"
      style={{
        background: "var(--theme-surface, #ffffff)",
        border: "1px solid var(--theme-border, #e5e7eb)",
        borderRadius: "var(--theme-radius-card, 16px)",
      }}
    >
      {showWishlist && (
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton product={product} size="sm" />
        </div>
      )}

      <div className="relative aspect-square overflow-hidden" style={{ background: "var(--theme-secondary, #f3f4f6)" }}>
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />

        {/* Badges */}
        {badges.length > 0 && (
          <div className="absolute top-2 left-2 flex flex-col gap-1">
            {badges.map((badge) => {
              const style = BADGE_STYLES[badge.variant] || BADGE_STYLES.new;
              return (
                <span
                  key={badge.label}
                  className="text-[10px] font-bold px-2 py-0.5 rounded-full"
                  style={{ background: style.bg, color: style.text }}
                >
                  {badge.label}
                </span>
              );
            })}
          </div>
        )}

        {/* Quick add overlay */}
        {(product.stock_quantity == null || product.stock_quantity > 0) && (
          <button
            onClick={handleQuickAdd}
            className="absolute bottom-2 right-2 w-9 h-9 rounded-full flex items-center justify-center shadow-lg opacity-0 group-hover:opacity-100 transition-opacity"
            style={{ background: "var(--theme-primary, #059669)" }}
          >
            <ShoppingCart className="w-4 h-4 text-white" />
          </button>
        )}
      </div>

      <div className="p-3 sm:p-4">
        <h3
          className="text-sm font-semibold truncate"
          style={{ color: "var(--theme-text, #111827)" }}
        >
          {product.name}
        </h3>
        {product.description && (
          <p
            className="text-xs mt-1 line-clamp-2"
            style={{ color: "var(--theme-text-muted, #6b7280)" }}
          >
            {product.description.replace(/<[^>]*>/g, "")}
          </p>
        )}
        <div className="flex items-center gap-2 mt-2">
          <p
            className="text-base font-bold"
            style={{ color: "var(--theme-primary, #059669)" }}
          >
            {product.price != null ? `${product.price.toLocaleString()} XOF` : "—"}
          </p>
          {hasDiscount && (
            <p className="text-xs line-through" style={{ color: "var(--theme-text-muted, #6b7280)" }}>
              {product.compareAtPrice!.toLocaleString()} XOF
            </p>
          )}
        </div>
      </div>
    </Link>
  );
}
