"use client";

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slug";

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

interface ProductContextValue {
  product: Product | null;
  loading: boolean;
  notFound: boolean;
}

const ProductContext = createContext<ProductContextValue>({
  product: null,
  loading: true,
  notFound: false,
});

export function ProductProvider({ children }: { children: ReactNode }) {
  const params = useParams();
  const slug = params.slug as string;
  const subdomain = params.subdomain as string;
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchProduct = async () => {
      const { data } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .eq("shop_slug", subdomain)
        .maybeSingle();

      if (cancelled) return;

      if (data) {
        setProduct(data);
      } else {
        const { data: all } = await supabase
          .from("products")
          .select("*")
          .eq("shop_slug", subdomain);

        if (cancelled) return;

        const found = all?.find((p) => slugify(p.name) === slug);
        if (found) {
          setProduct(found);
        } else {
          setNotFound(true);
        }
      }
      setLoading(false);
    };
    fetchProduct();
    return () => { cancelled = true; };
  }, [slug, subdomain]);

  return (
    <ProductContext.Provider value={{ product, loading, notFound }}>
      {children}
    </ProductContext.Provider>
  );
}

export function useProduct() {
  return useContext(ProductContext);
}
