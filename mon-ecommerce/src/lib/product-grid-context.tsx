"use client";

import { createContext, useContext, useState, useEffect, useMemo, ReactNode } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";

export interface Product {
  id: string;
  name: string;
  description: string | null;
  price: number | null;
  images: string[] | null;
  stock_quantity: number | null;
  slug?: string;
  created_at?: string;
  compareAtPrice?: number | null;
}

interface ProductGridContextValue {
  products: Product[];
  filtered: Product[];
  loading: boolean;
  query: string;
  setQuery: (v: string) => void;
  sortBy: string;
  setSortBy: (v: string) => void;
  priceMin: string;
  setPriceMin: (v: string) => void;
  priceMax: string;
  setPriceMax: (v: string) => void;
}

const defaultContext: ProductGridContextValue = {
  products: [],
  filtered: [],
  loading: false,
  query: "",
  setQuery: () => {},
  sortBy: "newest",
  setSortBy: () => {},
  priceMin: "",
  setPriceMin: () => {},
  priceMax: "",
  setPriceMax: () => {},
};

const ProductGridContext = createContext<ProductGridContextValue>(defaultContext);

export const SAMPLE_PRODUCTS: Product[] = [
  {
    id: "sample-1",
    name: "T-shirt Premium Coton Bio",
    description: "Confortable, élégant et résistant pour toutes les occasions.",
    price: 29.99,
    compareAtPrice: 39.99,
    images: ["https://images.unsplash.com/photo-1521572267360-ee0c2909d518?q=80&w=1974&auto=format&fit=crop"],
    stock_quantity: 20,
    slug: "t-shirt-premium-coton-bio",
  },
  {
    id: "sample-2",
    name: "Sneakers Minimalistes Urbaines",
    description: "Design intemporel et semelle ergonomique ultra confortable.",
    price: 89.99,
    compareAtPrice: 110.00,
    images: ["https://images.unsplash.com/photo-1542291026-7eec264c27ff?q=80&w=2070&auto=format&fit=crop"],
    stock_quantity: 12,
    slug: "sneakers-minimalistes-urbaines",
  },
  {
    id: "sample-3",
    name: "Montre Chronographe Classique",
    description: "Boîtier en acier inoxydable et mouvement de précision.",
    price: 149.00,
    compareAtPrice: 189.00,
    images: ["https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop"],
    stock_quantity: 8,
    slug: "montre-chronographe-classique",
  },
  {
    id: "sample-4",
    name: "Sac à Dos Cuir Voyageur",
    description: "Compartiment ordinateur rembourré et finitions soignées.",
    price: 79.50,
    compareAtPrice: 99.00,
    images: ["https://images.unsplash.com/photo-1553062407-98eeb64c6a62?q=80&w=1974&auto=format&fit=crop"],
    stock_quantity: 15,
    slug: "sac-a-dos-cuir-voyageur",
  },
];

export function ProductGridProvider({
  children,
  subdomain: propSubdomain,
}: {
  children: ReactNode;
  subdomain?: string;
}) {
  const params = useParams<{ subdomain: string }>();
  const subdomain = propSubdomain || params?.subdomain;
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    if (!subdomain) {
      setLoading(false);
      return;
    }
    let cancelled = false;
    supabase
      .from("products")
      .select("*")
      .eq("shop_slug", subdomain)
      .order("created_at", { ascending: false })
      .then(
        ({ data, error }: any) => {
          if (cancelled) return;
          if (!error && data && data.length > 0) {
            const visible = data.filter((p: any) => p.status !== "archived");
            setProducts(visible.length > 0 ? visible : data);
          } else {
            setProducts(SAMPLE_PRODUCTS);
          }
          setLoading(false);
        },
        () => {
          if (!cancelled) {
            setProducts(SAMPLE_PRODUCTS);
            setLoading(false);
          }
        }
      );
    return () => { cancelled = true; };
  }, [subdomain]);

  const filtered = useMemo(() => {
    let result = [...products];
    if (query) {
      const q = query.toLowerCase();
      result = result.filter((p) =>
        p.name.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q)
      );
    }
    if (priceMin) {
      const min = parseFloat(priceMin);
      if (!isNaN(min)) result = result.filter((p) => (p.price || 0) >= min);
    }
    if (priceMax) {
      const max = parseFloat(priceMax);
      if (!isNaN(max)) result = result.filter((p) => (p.price || 0) <= max);
    }
    result.sort((a, b) => {
      switch (sortBy) {
        case "price-asc": return (a.price || 0) - (b.price || 0);
        case "price-desc": return (b.price || 0) - (a.price || 0);
        case "name": return a.name.localeCompare(b.name);
        default: return new Date(b.created_at || 0).getTime() - new Date(a.created_at || 0).getTime();
      }
    });
    return result;
  }, [products, query, sortBy, priceMin, priceMax]);

  return (
    <ProductGridContext.Provider value={{ products, filtered, loading, query, setQuery, sortBy, setSortBy, priceMin, setPriceMin, priceMax, setPriceMax }}>
      {children}
    </ProductGridContext.Provider>
  );
}

export function useProductGrid() {
  return useContext(ProductGridContext);
}
