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

export function ProductGridProvider({ children }: { children: ReactNode }) {
  const { subdomain } = useParams<{ subdomain: string }>();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [sortBy, setSortBy] = useState("newest");
  const [priceMin, setPriceMin] = useState("");
  const [priceMax, setPriceMax] = useState("");

  useEffect(() => {
    supabase
      .from("products")
      .select("*")
      .eq("shop_slug", subdomain)
      .eq("status", "active")
      .order("created_at", { ascending: false })
      .then(({ data }) => {
        if (data) setProducts(data);
        setLoading(false);
      });
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
