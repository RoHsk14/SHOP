"use client";

import { useState, useEffect, useRef } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { supabase } from "@/lib/supabase";
import { Search, X, Loader } from "lucide-react";
import { useShop } from "@/lib/shop-context";

interface Product {
  id: string;
  name: string;
  price: number | null;
  images: string[] | null;
  slug?: string;
}

export default function SearchModal() {
  const { searchOpen, closeSearch, subdomain } = useShop();
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (searchOpen) {
      setQuery("");
      setResults([]);
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  }, [searchOpen]);

  useEffect(() => {
    if (!query.trim() || !subdomain) {
      setResults([]);
      return;
    }
    const timer = setTimeout(async () => {
      setLoading(true);
      const { data } = await supabase
        .from("products")
        .select("id, name, price, images, slug")
        .eq("shop_slug", subdomain)
        .ilike("name", `%${query}%`)
        .limit(8);
      setResults(data || []);
      setLoading(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [query, subdomain]);

  if (!searchOpen) return null;

  return (
    <div className="fixed inset-0 z-[70] flex items-start justify-center pt-[15vh]">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={closeSearch} />
      <div
        className="relative w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden"
        style={{ background: "var(--theme-surface, #fff)" }}
      >
        <div className="flex items-center gap-3 p-4 border-b" style={{ borderColor: "var(--theme-border)" }}>
          <Search className="w-5 h-5 shrink-0" style={{ color: "var(--theme-text-muted)" }} />
          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Rechercher un produit..."
            className="flex-1 text-base bg-transparent border-none outline-none"
            style={{ color: "var(--theme-text)" }}
          />
          <button onClick={closeSearch} className="p-1 hover:opacity-70">
            <X className="w-5 h-5" style={{ color: "var(--theme-text-muted)" }} />
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto p-2">
          {loading && (
            <div className="flex justify-center py-8">
              <Loader className="w-5 h-5 animate-spin" style={{ color: "var(--theme-primary)" }} />
            </div>
          )}

          {!loading && query && results.length === 0 && (
            <p className="text-sm text-center py-8" style={{ color: "var(--theme-text-muted)" }}>
              Aucun résultat pour "{query}"
            </p>
          )}

          {results.length > 0 && (
            <div className="space-y-1">
              {results.map((p) => {
                const slug = p.slug || p.name.toLowerCase().replace(/\s+/g, "-");
                return (
                  <Link
                    key={p.id}
                    href={`/boutiques/${subdomain}/products/${slug}`}
                    onClick={closeSearch}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-gray-50 transition-colors"
                  >
                    <div
                      className="w-12 h-12 rounded-lg overflow-hidden shrink-0"
                      style={{ background: "var(--theme-secondary)" }}
                    >
                      {p.images?.[0] && (
                        <img src={p.images[0]} alt="" className="w-full h-full object-cover" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-medium truncate" style={{ color: "var(--theme-text)" }}>
                        {p.name}
                      </p>
                      {p.price != null && (
                        <p className="text-xs font-semibold mt-0.5" style={{ color: "var(--theme-primary)" }}>
                          {p.price.toLocaleString()} XOF
                        </p>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}

          {!query && (
            <p className="text-sm text-center py-8" style={{ color: "var(--theme-text-muted)" }}>
              Tapez pour rechercher des produits
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
