"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { slugify } from "@/lib/slug";
import ProductShowcase from "@/components/ProductShowcase";

interface Product {
  id: string;
  name: string;
  description: string | null;
  prices: Record<string, number> | null;
  images: string[] | null;
  stock_quantity: number | null;
  slug?: string;
}

export default function ProductPage() {
  const params = useParams();
  const [products, setProducts] = useState<Product[]>([]);
  const [initialProductId, setInitialProductId] = useState<string | undefined>();
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const fetchProducts = async () => {
      const slug = params.slug as string;
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .eq("slug", slug)
        .order("created_at", { ascending: false });
      if (error || !data || data.length === 0) {
        const { data: allData } = await supabase
          .from("products")
          .select("*")
          .order("created_at", { ascending: false });
        if (allData) {
          const found = allData.find((p) => slugify(p.name) === slug);
          if (found) {
            setProducts(allData);
            setInitialProductId(found.id);
          } else {
            setNotFound(true);
          }
        } else {
          setNotFound(true);
        }
      } else {
        setProducts(data);
        setInitialProductId(data[0]?.id);
      }
      setLoading(false);
    };
    fetchProducts();
  }, [params.slug]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  if (notFound || products.length === 0) {
    return (
      <main className="min-h-screen bg-gray-50">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-20 text-center">
          <h1 className="text-xl font-bold text-gray-900 mb-2">Produit introuvable</h1>
          <a href="/" className="text-emerald-600 hover:underline text-sm">Retour à la boutique</a>
        </div>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        <ProductShowcase products={products} initialProductId={initialProductId} />
      </div>
    </main>
  );
}
