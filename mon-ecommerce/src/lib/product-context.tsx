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

export function ProductProvider({
  children,
  subdomain: propSubdomain,
  slug: propSlug,
}: {
  children: ReactNode;
  subdomain?: string;
  slug?: string;
}) {
  const params = useParams();
  const slug = propSlug || (params?.slug as string);
  const subdomain = propSubdomain || (params?.subdomain as string);
  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const fetchProduct = async () => {
      try {
        if (!subdomain) {
          setLoading(false);
          return;
        }

        if (slug) {
          const { data } = await supabase
            .from("products")
            .select("*")
            .eq("slug", slug)
            .eq("shop_slug", subdomain)
            .maybeSingle();

          if (cancelled) return;

          if (data) {
            setProduct(data);
            setLoading(false);
            return;
          }

          const { data: all } = await supabase
            .from("products")
            .select("*")
            .eq("shop_slug", subdomain);

          if (cancelled) return;

          const found = all?.find((p: any) => slugify(p.name) === slug);
          if (found) {
            setProduct(found);
            setLoading(false);
            return;
          }
        }

        // No slug provided (e.g. inside Customizer for /products/[slug])
        // or slug didn't match: fallback to the shop's first active product!
        const { data: allProducts } = await supabase
          .from("products")
          .select("*")
          .eq("shop_slug", subdomain)
          .order("created_at", { ascending: false });

        if (cancelled) return;

        if (allProducts && allProducts.length > 0) {
          const active = allProducts.find((p: any) => p.status !== "archived") || allProducts[0];
          setProduct(active);
          setNotFound(false);
        } else {
          // Fallback sample product for customizer
          setProduct({
            id: "preview-product",
            name: "Exemple de Produit Premium",
            description: "Découvrez notre produit d'exception fabriqué avec des matériaux durables et conçu pour un usage quotidien optimal. Confort supérieur et finitions de haute qualité.",
            price: 29.99,
            compareAtPrice: 39.99,
            images: [
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
              "https://images.unsplash.com/photo-1546868871-7041f2a55e12?q=80&w=1964&auto=format&fit=crop",
            ],
            stock_quantity: 15,
            slug: "exemple-produit",
          });
          setNotFound(false);
        }
      } catch (err) {
        if (!cancelled) {
          setProduct({
            id: "preview-product",
            name: "Exemple de Produit Premium",
            description: "Découvrez notre produit d'exception fabriqué avec des matériaux durables et conçu pour un usage quotidien optimal.",
            price: 29.99,
            compareAtPrice: 39.99,
            images: [
              "https://images.unsplash.com/photo-1523275335684-37898b6baf30?q=80&w=1999&auto=format&fit=crop",
            ],
            stock_quantity: 15,
            slug: "exemple-produit",
          });
          setNotFound(false);
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
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
