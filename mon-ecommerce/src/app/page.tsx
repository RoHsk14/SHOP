"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import ProductShowcase from "@/components/ProductShowcase";

interface Product {
  id: string;
  name: string;
  description: string | null;
  prices: Record<string, number> | null;
  images: string[] | null;
  stock_quantity: number | null;
}

export default function HomePage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchProducts = async () => {
      const { data, error } = await supabase
        .from("products")
        .select("*")
        .order("created_at", { ascending: false });
      if (!error && data) {
        setProducts(data);
      }
      setLoading(false);
    };
    fetchProducts();
  }, []);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-gray-200 border-t-emerald-600 rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Announcement bar */}
      <div className="bg-emerald-600 text-white text-center text-xs sm:text-sm font-medium py-2.5 px-4">
        🚚 Livraison gratuite pour toute commande &mdash; Profitez-en !
      </div>

      {/* Products */}
      <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 sm:py-10">
        {products.length === 0 ? (
          <div className="text-center py-20">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007zM8.625 10.5a.375.375 0 11-.75 0 .375.375 0 01.75 0zm7.5 0a.375.375 0 11-.75 0 .375.375 0 01.75 0z" /></svg>
            </div>
            <h2 className="text-lg font-semibold text-gray-900 mb-1">Aucun produit disponible</h2>
            <p className="text-sm text-gray-500">Revenez bientôt ou contactez-nous pour plus d&apos;informations, Merci</p>
          </div>
        ) : (
          <ProductShowcase products={products} />
        )}
      </div>

      {/* Footer */}
      <footer className="bg-white border-t border-gray-200 py-6 mt-8">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 text-center text-xs text-gray-400">
          &copy; {new Date().getFullYear()} Ma Boutique. Tous droits réservés.
        </div>
      </footer>
    </main>
  );
}
