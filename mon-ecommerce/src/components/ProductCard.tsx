"use client";

import Image from "next/image";
import Link from "next/link";
interface Product {
  id: string;
  name: string;
  description?: string | null;
  price?: number | null;
  images?: string[] | null;
  stock_quantity?: number | null;
  slug?: string;
}

interface ProductCardProps {
  product: Product;
  subdomain: string;
}

export default function ProductCard({ product, subdomain }: ProductCardProps) {
  const imageUrl = product.images?.[0]
    || "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=400&auto=format&fit=crop";
  const slug = product.slug || product.name.toLowerCase().replace(/\s+/g, "-");

  return (
    <Link
      href={`/boutiques/${subdomain}/products/${slug}`}
      className="group block rounded-xl overflow-hidden transition-all hover:shadow-lg"
      style={{
        background: "var(--theme-surface, #ffffff)",
        border: "1px solid var(--theme-border, #e5e7eb)",
        borderRadius: "var(--theme-radius-card, 16px)",
      }}
    >
      <div className="relative aspect-square overflow-hidden" style={{ background: "var(--theme-secondary, #f3f4f6)" }}>
        <Image
          src={imageUrl}
          alt={product.name}
          fill
          className="object-cover group-hover:scale-105 transition-transform duration-500"
          unoptimized
        />
        {(product.stock_quantity || 0) > 0 && (
          <span
            className="absolute top-2 left-2 text-[10px] font-bold px-2 py-0.5 rounded-full text-white"
            style={{ background: "var(--theme-primary, #059669)" }}
          >
            En stock
          </span>
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
        <p
          className="text-base font-bold mt-2"
          style={{ color: "var(--theme-primary, #059669)" }}
        >
          {product.price != null ? `${product.price.toLocaleString()} XOF` : "—"}
        </p>
      </div>
    </Link>
  );
}
